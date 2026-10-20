export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const tokenResponse = await fetch('/api/auth/csrf', {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: options.signal,
    })

    if (!tokenResponse.ok) {
      throw new Error('Could not get the security token.')
    }

    const csrf = await tokenResponse.json()
    headers.set(csrf.headerName, csrf.token)
  }

  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'same-origin',
  })
}