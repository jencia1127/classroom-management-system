import { useEffect, useState } from 'react'
import { apiFetch } from './api'

const emptyForm = {
  subject: '',
  topic: '',
  lessonDate: '',
  details: '',
}

export default function LessonPlans() {
  const [plans, setPlans] = useState([])
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

    async function loadPlans() {
      try {
        const response = await apiFetch('/api/lesson-plans', {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Could not load lesson plans.')

        const data = await response.json()
        if (!controller.signal.aborted) setPlans(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load lesson plans. Check the backend and refresh.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadPlans()
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

  function startEdit(plan) {
    setForm({
      subject: plan.subject,
      topic: plan.topic,
      lessonDate: plan.lessonDate,
      details: plan.details,
    })
    setEditingId(plan.id)
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
      topic: form.topic.trim(),
      lessonDate: form.lessonDate,
      details: form.details.trim(),
    }

    if (
      !details.subject ||
      !details.topic ||
      !details.lessonDate ||
      !details.details
    ) {
      setError('Please complete every field.')
      return
    }

    setBusy(true)

    try {
      const response = await apiFetch(
        editingId === null
          ? '/api/lesson-plans'
          : `/api/lesson-plans/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(details),
        },
      )

      if (!response.ok) throw new Error('Could not save lesson plan.')

      const savedPlan = await response.json()
      setPlans((current) =>
        editingId === null
          ? [...current, savedPlan]
          : current.map((plan) =>
              plan.id === editingId ? savedPlan : plan,
            ),
      )

      setMessage(
        editingId === null ? 'Lesson plan added.' : 'Lesson plan updated.',
      )
      resetForm()
    } catch {
      setError('Could not save the lesson plan. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function deletePlan(plan) {
    if (busy || loading) return
    if (!window.confirm(`Delete the lesson plan "${plan.topic}"?`)) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(`/api/lesson-plans/${plan.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Could not delete lesson plan.')

      setPlans((current) => current.filter((item) => item.id !== plan.id))
      if (editingId === plan.id) resetForm()
      setMessage('Lesson plan deleted.')
    } catch {
      setError('Could not delete the lesson plan. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2>Lesson Plans</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy || loading}>
          <legend>
            {editingId === null ? 'Add Lesson Plan' : 'Edit Lesson Plan'}
          </legend>

          <p>
            <label htmlFor="lesson-subject">Subject</label>
            <br />
            <input
              id="lesson-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </p>

          <p>
            <label htmlFor="lesson-topic">Topic</label>
            <br />
            <input
              id="lesson-topic"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </p>

          <p>
            <label htmlFor="lesson-date">Lesson Date</label>
            <br />
            <input
              id="lesson-date"
              name="lessonDate"
              type="date"
              value={form.lessonDate}
              onChange={handleChange}
              required
            />
          </p>

          <p>
            <label htmlFor="lesson-details">Lesson Details</label>
            <br />
            <textarea
              id="lesson-details"
              name="details"
              rows={5}
              value={form.details}
              onChange={handleChange}
              maxLength={5000}
              required
            />
          </p>

          <button type="submit">
            {busy
              ? 'Saving...'
              : editingId === null
                ? 'Add Lesson Plan'
                : 'Update Lesson Plan'}
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
          Refresh Lesson Plans
        </button>
      </p>

      {loading ? (
        <p>Loading lesson plans...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...plans]
              .sort((a, b) => a.lessonDate.localeCompare(b.lessonDate))
              .map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.lessonDate}</td>
                  <td>{plan.subject}</td>
                  <td>{plan.topic}</td>
                  <td style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {plan.details}
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEdit(plan)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deletePlan(plan)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

            {plans.length === 0 && (
              <tr>
                <td colSpan={5}>No lesson plans added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}