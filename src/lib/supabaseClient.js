import { createClient } from '@supabase/supabase-js';
import {
  getOptionalSupabaseBrowserConfig,
  SUPABASE_CONFIG_ERROR_MESSAGE,
  SupabaseConfigError,
  supabaseAuthOptions,
} from './supabaseConfig';

const optionalConfig = getOptionalSupabaseBrowserConfig();

function createUnavailableError() {
  return new SupabaseConfigError(SUPABASE_CONFIG_ERROR_MESSAGE);
}

function createUnavailableResult() {
  return { data: null, error: createUnavailableError() };
}

function createUnavailableQuery() {
  const query = {};
  const chainMethods = [
    'select',
    'insert',
    'upsert',
    'update',
    'delete',
    'eq',
    'neq',
    'ilike',
    'in',
    'is',
    'gt',
    'gte',
    'lt',
    'lte',
    'contains',
    'or',
    'order',
    'limit',
    'range',
  ];

  chainMethods.forEach((method) => {
    query[method] = () => query;
  });

  query.single = async () => createUnavailableResult();
  query.maybeSingle = async () => createUnavailableResult();
  query.then = (...args) => Promise.resolve(createUnavailableResult()).then(...args);
  query.catch = (...args) => Promise.resolve(createUnavailableResult()).catch(...args);
  query.finally = (...args) => Promise.resolve(createUnavailableResult()).finally(...args);

  return query;
}

function createUnavailableSupabaseClient() {
  const unavailableAuthResult = async () => createUnavailableResult();

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: unavailableAuthResult,
      signUp: unavailableAuthResult,
      signInWithOAuth: unavailableAuthResult,
      resetPasswordForEmail: unavailableAuthResult,
      signOut: async () => ({ error: null }),
    },
    from: () => createUnavailableQuery(),
  };
}

export const supabaseConfigStatus = Object.freeze({
  configured: Boolean(optionalConfig),
  error: optionalConfig ? null : createUnavailableError(),
});

export const supabase = optionalConfig
  ? createClient(optionalConfig.url, optionalConfig.anonKey, {
    auth: supabaseAuthOptions,
  })
  : createUnavailableSupabaseClient();
