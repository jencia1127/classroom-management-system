import { useEffect, useState } from 'react'
import App from './App'
import Login from './Login'
import StudentPortal from './StudentPortal'
import { apiFetch } from './api'

export default function AuthApp() {
  const [account, setAccount] = useState(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function checkLogin() {
      try {
        const response = await apiFetch('/api/auth/me', {
          signal: controller.signal,
          cache: 'no-store',
        })

        if (response.status === 401) return
        if (!response.ok) throw new Error('Could not check login.')

        const data = await response.json()
        if (!controller.signal.aborted) setAccount(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not check your session. You can try logging in below.')
        }
      } finally {
        if (!controller.signal.aborted) setChecking(false)
      }
    }

    checkLogin()
    return () => controller.abort()
  }, [])

  async function logout() {
    if (busy) return

    setBusy(true)
    setError('')

    try {
      const response = await apiFetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok && response.status !== 401) {
        throw new Error('Could not log out.')
      }

      setAccount(null)
    } catch {
      setError('Could not log out. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (checking) {
    return <main><p>Checking login...</p></main>
  }

  if (!account) {
    return (
      <>
        {error && <p role="alert">{error}</p>}
        <Login
          onLogin={(user) => {
            setError('')
            setAccount(user)
          }}
        />
      </>
    )
  }

  return (
    <>
      <header className="account-bar">
        <span>
          Signed in as <strong>{account.username}</strong> ({account.role})
        </span>
        <button type="button" disabled={busy} onClick={logout}>
          {busy ? 'Logging out...' : 'Logout'}
        </button>
      </header>

      {error && <p role="alert">{error}</p>}

      {account.role === 'TEACHER' ? (
        <App />
      ) : account.role === 'STUDENT' ? (
        <StudentPortal />
      ) : (
        <main><p role="alert">This account has an unsupported role.</p></main>
      )}
    </>
  )
}