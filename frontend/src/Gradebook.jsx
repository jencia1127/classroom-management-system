import { useEffect, useState } from 'react'
import { apiFetch } from './api'

const emptyForm = {
  studentId: '',
  subject: '',
  assessment: '',
  marksObtained: '',
  maximumMarks: '100',
}

export default function Gradebook({ students }) {
  const [grades, setGrades] = useState([])
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

    async function loadGrades() {
      try {
        const response = await apiFetch('/api/grades', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load grades.')
        }

        const data = await response.json()
        setGrades(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load grades. Check that the backend is running.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadGrades()
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

  function startEdit(grade) {
    setForm({
      studentId: String(grade.studentId),
      subject: grade.subject,
      assessment: grade.assessment,
      marksObtained: String(grade.marksObtained),
      maximumMarks: String(grade.maximumMarks),
    })
    setEditingId(grade.id)
    setError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy || loading) return

    setError('')
    setMessage('')

    const marks = Number(form.marksObtained)
    const maximum = Number(form.maximumMarks)

    if (
      !form.studentId ||
      !form.subject.trim() ||
      !form.assessment.trim() ||
      !form.marksObtained.trim() ||
      !form.maximumMarks.trim()
    ) {
      setError('Please complete every field.')
      return
    }

    if (
      !Number.isFinite(marks) ||
      !Number.isFinite(maximum) ||
      maximum <= 0 ||
      marks < 0 ||
      marks > maximum
    ) {
      setError('Marks must be between zero and the positive maximum marks.')
      return
    }

    if (!students.some((student) => String(student.id) === form.studentId)) {
      setError('Please select an existing student.')
      return
    }

    setBusy(true)

    try {
      const response = await apiFetch(
        editingId === null ? '/api/grades' : `/api/grades/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: Number(form.studentId),
            subject: form.subject.trim(),
            assessment: form.assessment.trim(),
            marksObtained: marks,
            maximumMarks: maximum,
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Could not save marks.')
      }

      const savedGrade = await response.json()

      setGrades((current) =>
        editingId === null
          ? [...current, savedGrade]
          : current.map((grade) =>
              grade.id === editingId ? savedGrade : grade,
            ),
      )

      setMessage(editingId === null ? 'Marks added.' : 'Marks updated.')
      resetForm()
    } catch {
      setError('Could not save marks. Check your details and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteGrade(grade) {
    if (busy || loading) return
    if (!window.confirm('Delete these marks?')) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(`/api/grades/${grade.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Could not delete marks.')
      }

      setGrades((current) =>
        current.filter((item) => item.id !== grade.id),
      )

      if (editingId === grade.id) resetForm()
      setMessage('Marks deleted.')
    } catch {
      setError('Could not delete marks. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2>Gradebook</h2>
      <p>
        Enter marks to calculate the percentage and letter grade automatically.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy || loading || students.length === 0}>
          <legend>{editingId === null ? 'Add Marks' : 'Edit Marks'}</legend>

          <p>
            <label htmlFor="grade-student">Student</label>
            <br />
            <select
              id="grade-student"
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              required
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.rollNumber})
                </option>
              ))}
            </select>
          </p>

          <p>
            <label htmlFor="grade-subject">Subject</label>
            <br />
            <input
              id="grade-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </p>

          <p>
            <label htmlFor="grade-assessment">Assessment</label>
            <br />
            <input
              id="grade-assessment"
              name="assessment"
              placeholder="Example: Mid-sem Exam"
              value={form.assessment}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </p>

          <p>
            <label htmlFor="grade-marks">Marks Obtained</label>
            <br />
            <input
              id="grade-marks"
              name="marksObtained"
              type="number"
              min="0"
              step="any"
              value={form.marksObtained}
              onChange={handleChange}
              required
            />
          </p>

          <p>
            <label htmlFor="grade-maximum">Maximum Marks</label>
            <br />
            <input
              id="grade-maximum"
              name="maximumMarks"
              type="number"
              min="0.01"
              step="any"
              value={form.maximumMarks}
              onChange={handleChange}
              required
            />
          </p>

          <button type="submit">
            {busy ? 'Saving...' : editingId === null ? 'Add Marks' : 'Update Marks'}
          </button>

          {editingId !== null && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </fieldset>
      </form>

      {students.length === 0 && <p>Add a student first to enter marks.</p>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <p>
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => setRefreshCount((current) => current + 1)}
        >
          Refresh Grades
        </button>
      </p>

      {loading ? (
        <p>Loading grades...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Subject</th>
              <th>Assessment</th>
              <th>Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => {
              const student = students.find(
                (item) => item.id === grade.studentId,
              )

              return (
                <tr key={grade.id}>
                  <td>
                    {student
                      ? `${student.name} (${student.rollNumber})`
                      : `Removed student #${grade.studentId}`}
                  </td>
                  <td>{grade.subject}</td>
                  <td>{grade.assessment}</td>
                  <td>{grade.marksObtained} / {grade.maximumMarks}</td>
                  <td>{grade.percentage.toFixed(2)}%</td>
                  <td>{grade.letterGrade}</td>
                  <td>
                    <button
                      type="button"
                      disabled={busy || !student}
                      onClick={() => startEdit(grade)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteGrade(grade)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}

            {grades.length === 0 && (
              <tr>
                <td colSpan={7}>No marks added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}