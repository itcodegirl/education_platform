import { json } from 'react-router-dom';
import { COURSES } from '../data';
import { supabase } from '../lib/supabaseClient';
import { resolveStableLessonKeyAcrossCourses } from '../utils/lessonKeys';
import { createRecoverableLearnActionWrite } from './learnRouteRecovery';

async function parseActionPayload(request) {
  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      return { payload: await request.json(), error: null };
    }

    const formData = await request.formData();
    return { payload: Object.fromEntries(formData.entries()), error: null };
  } catch {
    return { payload: {}, error: 'Invalid action payload' };
  }
}

async function requireAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return { user: null, response: json({ ok: false, error: 'Authentication required' }, { status: 401 }) };
  }

  return { user, response: null };
}

function resolveLessonKey(rawLessonKey) {
  const stableLessonKey = resolveStableLessonKeyAcrossCourses(rawLessonKey, COURSES);
  const lessonKey = stableLessonKey || rawLessonKey;
  const candidateKeys = [...new Set([lessonKey, rawLessonKey])];

  return { lessonKey, candidateKeys };
}

function resolveBooleanMode(mode, truthyValue, falseyValue) {
  if (mode === truthyValue) return true;
  if (mode === falseyValue) return false;
  return undefined;
}

async function handleProgressAction({ payload, mode, intent, user }) {
  const rawLessonKey = typeof payload.lessonKey === 'string' ? payload.lessonKey.trim() : '';
  if (!rawLessonKey) {
    return json({ ok: false, error: 'Missing lesson key' }, { status: 400 });
  }

  const recoverableWrite = createRecoverableLearnActionWrite(intent, payload);
  const { lessonKey, candidateKeys } = resolveLessonKey(rawLessonKey);
  const shouldComplete = resolveBooleanMode(mode, 'complete', 'uncomplete');

  const { data: existing, error: existingError } = await supabase
    .from('progress')
    .select('lesson_key')
    .eq('user_id', user.id)
    .in('lesson_key', candidateKeys);
  if (existingError) {
    return json({ ok: false, intent, error: existingError.message, recoverableWrite }, { status: 500 });
  }

  const hasCompletion = Array.isArray(existing) && existing.length > 0;
  const nextCompleted = typeof shouldComplete === 'boolean' ? shouldComplete : !hasCompletion;

  if (nextCompleted) {
    const { error } = await supabase
      .from('progress')
      .upsert({ user_id: user.id, lesson_key: lessonKey, completed_at: new Date().toISOString() });
    if (error) return json({ ok: false, intent, error: error.message, recoverableWrite }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('progress')
      .delete()
      .eq('user_id', user.id)
      .in('lesson_key', candidateKeys);
    if (error) return json({ ok: false, intent, error: error.message, recoverableWrite }, { status: 500 });
  }

  return json({
    ok: true,
    intent,
    lessonKey,
    completed: nextCompleted,
  });
}

async function handleBookmarkAction({ payload, mode, intent, user }) {
  const rawLessonKey = typeof payload.lessonKey === 'string' ? payload.lessonKey.trim() : '';
  const courseId = typeof payload.courseId === 'string' ? payload.courseId : '';
  const lessonTitle = typeof payload.lessonTitle === 'string' ? payload.lessonTitle : '';
  if (!rawLessonKey || !courseId || !lessonTitle) {
    return json({ ok: false, error: 'Missing bookmark fields' }, { status: 400 });
  }

  const recoverableWrite = createRecoverableLearnActionWrite(intent, payload);
  const { lessonKey, candidateKeys } = resolveLessonKey(rawLessonKey);
  const shouldSave = resolveBooleanMode(mode, 'save', 'remove');

  const { data: existing, error: existingError } = await supabase
    .from('bookmarks')
    .select('lesson_key')
    .eq('user_id', user.id)
    .in('lesson_key', candidateKeys);
  if (existingError) {
    return json({ ok: false, intent, error: existingError.message, recoverableWrite }, { status: 500 });
  }

  const hasBookmark = Array.isArray(existing) && existing.length > 0;
  const nextSaved = typeof shouldSave === 'boolean' ? shouldSave : !hasBookmark;

  if (nextSaved) {
    const { error } = await supabase.from('bookmarks').upsert({
      user_id: user.id,
      lesson_key: lessonKey,
      course_id: courseId,
      lesson_title: lessonTitle,
    });
    if (error) return json({ ok: false, intent, error: error.message, recoverableWrite }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .in('lesson_key', candidateKeys);
    if (error) return json({ ok: false, intent, error: error.message, recoverableWrite }, { status: 500 });
  }

  return json({
    ok: true,
    intent,
    lessonKey,
    saved: nextSaved,
  });
}

export async function learnRouteAction({ request }) {
  const { payload, error: payloadError } = await parseActionPayload(request);
  if (payloadError) {
    return json({ ok: false, error: payloadError }, { status: 400 });
  }

  const intent = typeof payload.intent === 'string' ? payload.intent : '';
  const mode = typeof payload.mode === 'string' ? payload.mode : 'toggle';
  const { user, response } = await requireAuthenticatedUser();
  if (response) return response;

  if (intent === 'toggle-progress') {
    return handleProgressAction({ payload, mode, intent, user });
  }

  if (intent === 'toggle-bookmark') {
    return handleBookmarkAction({ payload, mode, intent, user });
  }

  return json({ ok: false, error: 'Unknown action intent' }, { status: 400 });
}
