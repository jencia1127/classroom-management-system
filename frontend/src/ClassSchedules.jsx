import { useEffect, useState } from 'react'
import { apiFetch } from './api'

const days = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const emptyForm = {
  subject: '',
  dayOfWeek: 'MONDAY',
  startTime: '',
  endTime: '',
  room: '',
}

function dayLabel(day) {
  return day.charAt(0) + day.slice(1).toLowerCase()
}

export default function ClassSchedules() {
  const [schedules, setSchedules] = useState([])
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

    async function loadSchedules() {
      try {
        const response = await apiFetch('/api/schedules', {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Could not load schedules.')

        const data = await response.json()
        if (!controller.signal.aborted) setSchedules(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load schedules. Check the backend and refresh.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadSchedules()
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

  function startEdit(schedule) {
    setForm({
      subject: schedule.subject,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.slice(0, 5),
      endTime: schedule.endTime.slice(0, 5),
      room: schedule.room,
    })
    setEditingId(schedule.id)
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
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room.trim(),
    }

    if (
      !details.subject ||
      !details.dayOfWeek ||
      !details.startTime ||
      !details.endTime ||
      !details.room
    ) {
      setError('Please complete every field.')
      return
    }

    if (details.endTime <= details.startTime) {
      setError('End time must be later than start time.')
      return
    }

    setBusy(true)

    try {
      const response = await apiFetch(
        editingId === null
          ? '/api/schedules'
          : `/api/schedules/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(details),
        },
      )

      if (!response.ok) throw new Error('Could not save schedule.')

      const savedSchedule = await response.json()

      setSchedules((current) =>
        editingId === null
          ? [...current, savedSchedule]
          : current.map((schedule) =>
              schedule.id === editingId ? savedSchedule : schedule,
            ),
      )

      setMessage(
        editingId === null ? 'Class schedule added.' : 'Class schedule updated.',
      )
      resetForm()
    } catch {
      setError('Could not save the schedule. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteSchedule(schedule) {
    if (busy || loading) return
    if (!window.confirm(`Delete the ${schedule.subject} class schedule?`)) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(`/api/schedules/${schedule.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Could not delete schedule.')

      setSchedules((current) =>
        current.filter((item) => item.id !== schedule.id),
      )

      if (editingId === schedule.id) resetForm()
      setMessage('Class schedule deleted.')
    } catch {
      setError('Could not delete the schedule. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const sortedSchedules = [...schedules].sort(
    (a, b) =>
      days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek) ||
      a.startTime.localeCompare(b.startTime),
  )

  return (
    <section>
      <h2>Class Schedules</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy || loading}>
          <legend>
            {editingId === null ? 'Add Class Schedule' : 'Edit Class Schedule'}
          </legend>

          <p>
            <label htmlFor="schedule-subject">Subject</label>
            <br />
            <input
              id="schedule-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </p>

          <p>
            <label htmlFor="schedule-day">Day</label>
            <br />
            <select
              id="schedule-day"
              name="dayOfWeek"
              value={form.dayOfWeek}
              onChange={handleChange}
              required
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {dayLabel(day)}
                </option>
              ))}
            </select>
          </p>

          <p>
            <label htmlFor="schedule-start">Start Time</label>
            <br />
            <input
              id="schedule-start"
              name="startTime"
              type="time"
              value={form.startTime}
              onChange={handleChange}
              required
            />
          </p>

          <p>
            <label htmlFor="schedule-end">End Time</label>
            <br />
            <input
              id="schedule-end"
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={handleChange}
              required
            />
          </p>

          <p>
            <label htmlFor="schedule-room">Room</label>
            <br />
            <input
              id="schedule-room"
              name="room"
              value={form.room}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </p>

          <button type="submit">
            {busy
              ? 'Saving...'
              : editingId === null
                ? 'Add Class Schedule'
                : 'Update Class Schedule'}
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
          Refresh Schedules
        </button>
      </p>

      {loading ? (
        <p>Loading schedules...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Subject</th>
              <th>Start</th>
              <th>End</th>
              <th>Room</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSchedules.map((schedule) => (
              <tr key={schedule.id}>
                <td>{dayLabel(schedule.dayOfWeek)}</td>
                <td>{schedule.subject}</td>
                <td>{schedule.startTime.slice(0, 5)}</td>
                <td>{schedule.endTime.slice(0, 5)}</td>
                <td>{schedule.room}</td>
                <td>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startEdit(schedule)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteSchedule(schedule)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {schedules.length === 0 && (
              <tr>
                <td colSpan={6}>No class schedules added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}