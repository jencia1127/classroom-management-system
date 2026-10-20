import { useEffect, useState } from 'react'
import { apiFetch } from './api'

const emptyForm = {
  subject: '',
  title: '',
  dueDate: '',
  instructions: '',
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    async function loadAssignments() {
      try {
        const response = await apiFetch('/api/assignments', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load assignments.')
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setAssignments(data)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load assignments. Check the backend and refresh.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadAssignments()
    return () => controller.abort()
  }, [refreshCount])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  function startEdit(assignment) {
    setForm({
      subject: assignment.subject,
      title: assignment.title,
      dueDate: assignment.dueDate,
      instructions: assignment.instructions,
    })
    setEditingId(assignment.id)
    setError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy || loading) return

    setError('')
    setMessage('')

    const details = {
      subject: form.subject.trim(),
      title: form.title.trim(),
      dueDate: form.dueDate,
      instructions: form.instructions.trim(),
    }

    if (
      !details.subject ||
      !details.title ||
      !details.dueDate ||
      !details.instructions
    ) {
      setError('Please complete every field.')
      return
    }

    setBusy(true)

    try {
      const response = await apiFetch(
        editingId === null
          ? '/api/assignments'
          : `/api/assignments/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(details),
        },
      )

      if (!response.ok) {
        throw new Error('Could not save assignment.')
      }

      const savedAssignment = await response.json()

      setAssignments((current) =>
        editingId === null
          ? [...current, savedAssignment]
          : current.map((assignment) =>
              assignment.id === editingId ? savedAssignment : assignment,
            ),
      )

      setMessage(
        editingId === null ? 'Assignment added.' : 'Assignment updated.',
      )
      resetForm()
    } catch {
      setError('Could not save the assignment. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteAssignment(assignment) {
    if (busy || loading) return
    if (!window.confirm(`Delete the assignment "${assignment.title}"?`)) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(`/api/assignments/${assignment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Could not delete assignment.')
      }

      setAssignments((current) =>
        current.filter((item) => item.id !== assignment.id),
      )

      if (editingId === assignment.id) resetForm()
      setMessage('Assignment deleted.')
    } catch {
      setError('Could not delete the assignment. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2>Assignments</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy || loading}>
          <legend>
            {editingId === null ? 'Add Assignment' : 'Edit Assignment'}
          </legend>

          <p>
            <label htmlFor="assignment-subject">Subject</label>
            <br />
            <input
              id="assignment-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </p>

          <p>
            <label htmlFor="assignment-title">Assignment Title</label>
            <br />
            <input
              id="assignment-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </p>

          <p>
            <label htmlFor="assignment-date">Due Date</label>
            <br />
            <input
              id="assignment-date"
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
              required
            />
          </p>

          <p>
            <label htmlFor="assignment-instructions">Instructions</label>
            <br />
            <textarea
              id="assignment-instructions"
              name="instructions"
              rows={5}
              value={form.instructions}
              onChange={handleChange}
              maxLength={5000}
              required
            />
          </p>

          <button type="submit">
            {busy
              ? 'Saving...'
              : editingId === null
                ? 'Add Assignment'
                : 'Update Assignment'}
          </button>

          {editingId !== null && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </fieldset>
      </form>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <p>
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => setRefreshCount((current) => current + 1)}
        >
          Refresh Assignments
        </button>
      </p>

      {loading ? (
        <p>Loading assignments...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Due Date</th>
              <th>Subject</th>
              <th>Title</th>
              <th>Instructions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...assignments]
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.dueDate}</td>
                  <td>{assignment.subject}</td>
                  <td>{assignment.title}</td>
                  <td
                    style={{
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {assignment.instructions}
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEdit(assignment)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteAssignment(assignment)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

            {assignments.length === 0 && (
              <tr>
                <td colSpan={5}>No assignments added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}