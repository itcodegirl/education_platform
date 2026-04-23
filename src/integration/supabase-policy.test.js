import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
const describePolicy = missingEnv.length === 0 ? describe.sequential : describe.skip;

const runId = `policy-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const adminEmail = `${runId}-admin@example.test`;
const userEmail = `${runId}-user@example.test`;
const password = `Cinova!${Math.random().toString(36).slice(2, 10)}A1`;

function makeClient(key) {
  return createClient(process.env.SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

describePolicy('supabase rls and admin escalation policies', () => {
  let serviceClient;
  let adminClient;
  let userClient;
  let adminUserId;
  let regularUserId;
  let adminLessonKey;
  let userLessonKey;

  beforeAll(async () => {
    serviceClient = makeClient(process.env.SUPABASE_SERVICE_KEY);
    adminClient = makeClient(process.env.SUPABASE_ANON_KEY);
    userClient = makeClient(process.env.SUPABASE_ANON_KEY);

    const { data: createdAdmin, error: createAdminError } = await serviceClient.auth.admin.createUser({
      email: adminEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'Policy Admin' },
    });
    if (createAdminError) throw createAdminError;
    adminUserId = createdAdmin.user.id;

    const { data: createdUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email: userEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'Policy User' },
    });
    if (createUserError) throw createUserError;
    regularUserId = createdUser.user.id;

    const { error: profileSeedError } = await serviceClient.from('profiles').upsert(
      [
        { id: adminUserId, display_name: 'Policy Admin', is_admin: true },
        { id: regularUserId, display_name: 'Policy User', is_admin: false },
      ],
      { onConflict: 'id' },
    );
    if (profileSeedError) throw profileSeedError;

    adminLessonKey = `c:policy|m:rls|l:${runId}-admin`;
    userLessonKey = `c:policy|m:rls|l:${runId}-user`;

    const { error: progressSeedError } = await serviceClient.from('progress').upsert(
      [
        { user_id: adminUserId, lesson_key: adminLessonKey },
        { user_id: regularUserId, lesson_key: userLessonKey },
      ],
      { onConflict: 'user_id,lesson_key' },
    );
    if (progressSeedError) throw progressSeedError;

    const { error: adminSignInError } = await adminClient.auth.signInWithPassword({
      email: adminEmail,
      password,
    });
    if (adminSignInError) throw adminSignInError;

    const { error: userSignInError } = await userClient.auth.signInWithPassword({
      email: userEmail,
      password,
    });
    if (userSignInError) throw userSignInError;
  });

  afterAll(async () => {
    if (!serviceClient) return;

    if (adminUserId) {
      await serviceClient.from('progress').delete().eq('user_id', adminUserId);
      await serviceClient.auth.admin.deleteUser(adminUserId);
    }
    if (regularUserId) {
      await serviceClient.from('progress').delete().eq('user_id', regularUserId);
      await serviceClient.auth.admin.deleteUser(regularUserId);
    }
  });

  it('prevents non-admins from toggling is_admin through direct profile updates', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', regularUserId);

    expect(error).toBeTruthy();
    expect(error.message).toMatch(/is_admin can only be changed|permission denied/i);
  });

  it('blocks non-admin callers from using set_user_admin rpc', async () => {
    const { error } = await userClient.rpc('set_user_admin', {
      target_user_id: regularUserId,
      make_admin: true,
    });

    expect(error).toBeTruthy();
    expect(error.message).toMatch(/Admin privileges required/i);
  });

  it('blocks admin self-escalation or self-demotion attempts', async () => {
    const { error } = await adminClient.rpc('set_user_admin', {
      target_user_id: adminUserId,
      make_admin: false,
    });

    expect(error).toBeTruthy();
    expect(error.message).toMatch(/cannot change their own is_admin flag/i);
  });

  it('keeps progress rows isolated for regular users under rls', async () => {
    const { data, error } = await userClient
      .from('progress')
      .select('user_id, lesson_key')
      .in('lesson_key', [adminLessonKey, userLessonKey]);

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.some((row) => row.user_id === adminUserId)).toBe(false);
    expect(data.some((row) => row.user_id === regularUserId)).toBe(true);
  });

  it('allows admins to promote another user through the sanctioned rpc path', async () => {
    const { error: promoteError } = await adminClient.rpc('set_user_admin', {
      target_user_id: regularUserId,
      make_admin: true,
    });
    expect(promoteError).toBeNull();

    const { data: promotedProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('is_admin')
      .eq('id', regularUserId)
      .single();
    expect(profileError).toBeNull();
    expect(promotedProfile?.is_admin).toBe(true);

    const { data: auditRow, error: auditError } = await serviceClient
      .from('admin_audit_log')
      .select('actor_id, target_id, action')
      .eq('actor_id', adminUserId)
      .eq('target_id', regularUserId)
      .eq('action', 'grant_admin')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    expect(auditError).toBeNull();
    expect(auditRow).toBeTruthy();
  });

  it('blocks non-admin callers from admin_dashboard_metrics rpc', async () => {
    const { data, error } = await userClient.rpc('admin_dashboard_metrics');

    expect(data).toBeNull();
    expect(error).toBeTruthy();
    expect(error.message).toMatch(/Admin privileges required/i);
  });

  it('allows admins to read dashboard metrics through rpc', async () => {
    const { data, error } = await adminClient.rpc('admin_dashboard_metrics');

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(typeof data.totalUsers).toBe('number');
    expect(typeof data.totalCompletions).toBe('number');
    expect(Array.isArray(data.topUsers)).toBe(true);
  });

  it('blocks non-admin callers from analytics snapshot rpcs', async () => {
    const refreshResult = await userClient.rpc('refresh_analytics_daily_funnel', {
      p_days_back: 30,
    });
    expect(refreshResult.error).toBeTruthy();
    expect(refreshResult.error.message).toMatch(/Admin privileges required/i);

    const queryResult = await userClient.rpc('get_analytics_daily_funnel', {
      p_days: 30,
    });
    expect(queryResult.error).toBeTruthy();
    expect(queryResult.error.message).toMatch(/Admin privileges required/i);
  });

  it('allows admins to refresh and read analytics daily snapshots', async () => {
    const { error: refreshError } = await adminClient.rpc('refresh_analytics_daily_funnel', {
      p_days_back: 30,
    });
    expect(refreshError).toBeNull();

    const { data, error } = await adminClient.rpc('get_analytics_daily_funnel', {
      p_days: 30,
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
