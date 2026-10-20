import { useEffect, useState } from 'react'
import { apiFetch } from './api'

function today() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Attendance({ students }) {
  const [date, setDate] = useState(today)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadAttendance() {
      setLoading(true)
      setError('')
      setMessage('')
      setRecords([])

      try {
        const response = await apiFetch(`/api/attendance?date=${date}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error()
        setRecords(await response.json())
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load attendance. Check the backend.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadAttendance()
    return () => controller.abort()
  }, [date])

  async function markAttendance(student, present) {
    if (saving || loading || error) return

    setSaving(true)
    setMessage('')

    try {
      const response = await apiFetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          attendanceDate: date,
          present,
        }),
      })

      if (!response.ok) throw new Error()
      const saved = await response.json()

      setRecords((previous) => [
        ...previous.filter((record) => record.studentId !== student.id),
        saved,
      ])

      setMessage(
        `${student.name} marked ${present ? 'present' : 'absent'}.`,
      )
    } catch {
      setMessage('Could not save attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <h2>Attendance</h2>

      <label htmlFor="attendanceDate">Select Date</label>
      <br />
      <input
        id="attendanceDate"
        type="date"
        value={date}
        disabled={saving}
        onChange={(event) => {
          if (event.target.value) setDate(event.target.value)
        }}
      />

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      {loading ? (
        <p>Loading attendance...</p>
      ) : error ? (
        <p>Refresh the page to try again.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll Number</th>
              <th>Status</th>
              <th>Mark Attendance</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const record = records.find(
                (item) => item.studentId === student.id,
              )

              return (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.rollNumber}</td>
                  <td>
                    {record
                      ? record.present
                        ? 'Present'
                        : 'Absent'
                      : 'Not marked'}
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => markAttendance(student, true)}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => markAttendance(student, false)}
                    >
                      Absent
                    </button>
                  </td>
                </tr>
              )
            })}

            {students.length === 0 && (
              <tr>
                <td colSpan={4}>Add a student to mark attendance.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}