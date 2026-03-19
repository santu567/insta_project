const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Only add ngrok bypass header in development (when using ngrok URLs)
const isNgrok = API_URL.includes('ngrok');

/**
 * Wrapper around fetch that automatically adds credentials and ngrok headers.
 * Use this for all API calls to avoid repeating boilerplate.
 */
export function fetchApi(path, options = {}) {
  const headers = {
    ...options.headers,
  };

  if (isNgrok) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });
}

export { API_URL };
