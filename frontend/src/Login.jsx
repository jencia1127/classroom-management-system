import { useState } from 'react'
import { apiFetch } from './api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError('')

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: new URLSearchParams({
          username: username.trim(),
          password,
        }),
      })

      if (!response.ok) {
        setError(
          response.status === 401
            ? 'Incorrect username or password.'
            : 'Could not log in. Please try again.',
        )
        return
      }

      const accountResponse = await apiFetch('/api/auth/me', {
        cache: 'no-store',
      })

      if (!accountResponse.ok) {
        throw new Error('Could not load account.')
      }

      const account = await accountResponse.json()
      setPassword('')
      onLogin(account)
    } catch {
      setError('Could not connect. Check that the backend is running.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Classroom Management</h1>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy}>
          <p>
            <label htmlFor="login-username">Username</label>
            <br />
            <input
              id="login-username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </p>

          <p>
            <label htmlFor="login-password">Password</label>
            <br />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </p>

          <button type="submit">
            {busy ? 'Logging in...' : 'Login'}
          </button>
        </fieldset>
      </form>

      {error && <p role="alert">{error}</p>}
    </main>
  )
}