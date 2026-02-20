import axios from 'axios';

// derive the base URL from environment variables (Vite prefixes are used at build time)
// the value **must** be either a relative path (e.g. '/api') or a fully-qualified URL
// in production we occasionally see misconfigured env vars like "padelbooking.onrender.com"
// which axios treats as a *relative* path, leading to requests such as
//   https://host/currenthost.com/padelbooking.onrender.com/...
// To avoid that we add a small helper that prepends `https://` when the value
// looks like a hostname without a scheme.  The function is exported so unit
// tests can verify its behaviour.
export function normalizeBase(raw: string): string {
  let trimmed = raw.replace(/\/+$/, '');

  // If the developer supplied a fully‑qualified URL, we want to make sure it
  // actually points at the API path. The backend lives under `/api`, so a
  // value like `https://padelbooking-1.onrender.com` will otherwise result in
  // requests to `/courts` which 404. Append `/api` automatically when the
  // host has no pathname or just `/`.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.pathname === '' || url.pathname === '/') {
        url.pathname = '/api';
      }
      return url.toString().replace(/\/+$/, '');
    } catch {
      // if URL parsing fails, fallthrough to heuristic below
    }
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // assume HTTPS by default; the user should still provide a correct protocol
  trimmed = `https://${trimmed}`;

  // re-run the check above to append /api when necessary
  try {
    const url = new URL(trimmed);
    if (url.pathname === '' || url.pathname === '/') {
      url.pathname = '/api';
    }
    return url.toString().replace(/\/+$/, '');
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '/api';

const API_BASE_URL = normalizeBase(rawBase);

if (API_BASE_URL !== rawBase) {
  console.warn(
    `[api] normalized VITE_API_BASE_URL from "${rawBase}" to "${API_BASE_URL}"`
  );
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isAuthRequest =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }

    // helpful diagnostic: if we get a 404 on any `/api` request it usually means
    // the baseURL is pointed at the wrong server (e.g. frontend host instead of
    // backend). show a clear message because the plain 404 from Cloudflare or
    // a static host is confusing for users.
    if (
      error.response?.status === 404 &&
      requestUrl.startsWith('/api')
    ) {
      console.error(
        `[api] received 404 for ${requestUrl}.` +
          ' Controlla che VITE_API_BASE_URL punti al servizio backend corretto.'
      );
    }

    return Promise.reject(error);
  }
);
