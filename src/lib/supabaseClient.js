import {
  SUPABASE_CONFIG_ERROR_MESSAGE,
  getOptionalSupabaseBrowserConfig,
} from './supabaseConfig';
import { getCachedSupabaseBrowserClient } from './supabaseBrowserClient';

const config = getOptionalSupabaseBrowserConfig();

function createUnavailableError() {
  const error = new Error(config.error?.userMessage || SUPABASE_CONFIG_ERROR_MESSAGE);
  error.code = config.error?.code || 'supabase_client_unavailable';
  return error;
}

function createUnavailableQuery() {
  const result = () => ({ data: null, error: createUnavailableError() });
  const query = {
    select: () => query,
    insert: () => query,
    upsert: () => query,
    update: () => query,
    delete: () => query,
    eq: () => query,
    neq: () => query,
    ilike: () => query,
    in: () => query,
    is: () => query,
    gt: () => query,
    gte: () => query,
    lt: () => query,
    lte: () => query,
    contains: () => query,
    or: () => query,
    order: () => query,
    limit: () => query,
    range: () => query,
    single: () => query,
    maybeSingle: () => query,
    then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
    catch: (reject) => Promise.resolve(result()).catch(reject),
    finally: (callback) => Promise.resolve(result()).finally(callback),
  };
  return query;
}

function createUnavailableSupabaseClient() {
  const authActionResult = () => Promise.resolve({ data: null, error: createUnavailableError() });

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: createUnavailableError() }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
      signInWithPassword: authActionResult,
      signUp: authActionResult,
      signInWithOAuth: authActionResult,
      resetPasswordForEmail: authActionResult,
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => createUnavailableQuery(),
    rpc: () => Promise.resolve({ data: null, error: createUnavailableError() }),
  };
}

export const supabaseConfigStatus = Object.freeze({
  configured: config.configured,
  error: config.error
    ? {
        code: config.error.code,
        message: config.error.userMessage || config.error.message,
      }
    : null,
});

export const supabase = config.configured
  ? getCachedSupabaseBrowserClient(config)
  : createUnavailableSupabaseClient();
