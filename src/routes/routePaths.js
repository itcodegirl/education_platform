export const APP_ROUTES = Object.freeze({
  home: '/',
  admin: '/admin',
  profile: '/profile',
  styleguide: '/styleguide',
  publicProfileBase: '/u',
  learnBase: '/learn',
});

const LEGACY_HASH_MAP = Object.freeze({
  '#admin': APP_ROUTES.admin,
  '#profile': APP_ROUTES.profile,
  '#styleguide': APP_ROUTES.styleguide,
});

function decodePathSegment(value = '') {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function toPathFromLegacyHash(hash = '') {
  if (!hash || hash === '#') return null;
  if (LEGACY_HASH_MAP[hash]) return LEGACY_HASH_MAP[hash];

  const publicMatch = hash.match(/^#u\/([^/?#]+)/);
  if (publicMatch) {
    return `${APP_ROUTES.publicProfileBase}/${encodeURIComponent(
      decodePathSegment(publicMatch[1]),
    )}`;
  }

  const learnMatch = hash.match(/^#learn\/([^/]+)\/([^/]+)\/([^/?#]+)/);
  if (learnMatch) {
    const courseId = encodeURIComponent(decodePathSegment(learnMatch[1]));
    const moduleId = encodeURIComponent(decodePathSegment(learnMatch[2]));
    const lessonId = encodeURIComponent(decodePathSegment(learnMatch[3]));
    return `${APP_ROUTES.learnBase}/${courseId}/${moduleId}/${lessonId}`;
  }

  return null;
}

export function parsePublicProfilePath(pathname = '') {
  const match = pathname.match(/^\/u\/([^/?#]+)/);
  if (!match) return null;

  const handle = decodePathSegment(match[1]);
  if (!/^[A-Za-z0-9_-]{2,30}$/.test(handle)) return null;
  return handle;
}

export function parseLearnPath(pathname = '') {
  const match = pathname.match(/^\/learn\/([^/]+)\/([^/]+)\/([^/?#]+)/);
  if (!match) return null;

  return {
    courseId: decodePathSegment(match[1]),
    moduleId: decodePathSegment(match[2]),
    lessonId: decodePathSegment(match[3]),
  };
}

export function buildLearnPath(course, mod, les, showModQuiz) {
  if (!course?.id || !mod?.id) return '';
  const lessonSegment = showModQuiz ? 'quiz' : les?.id;
  if (!lessonSegment) return '';

  return `${APP_ROUTES.learnBase}/${encodeURIComponent(course.id)}/${encodeURIComponent(
    mod.id,
  )}/${encodeURIComponent(lessonSegment)}`;
}

