import { useEffect, useState } from 'react'
import Attendance from './Attendance'
import AttendanceReport from './AttendanceReport'
import Gradebook from './Gradebook'
import ProgressReport from './ProgressReport'
import LessonPlans from './LessonPlans'
import Assignments from './Assignments'
import ClassSchedules from './ClassSchedules'
import { apiFetch } from './api'

const emptyForm = { name: '', rollNumber: '', email: '' }

const pages = [
  ['students', 'Students'],
  ['attendance', 'Attendance'],
  ['attendance-report', 'Attendance Report'],
  ['grades', 'Gradebook'],
  ['progress', 'Progress Reports'],
  ['lessons', 'Lesson Plans'],
  ['assignments', 'Assignments'],
  ['schedules', 'Class Schedules'],
]

export default function App() {
  const [page, setPage] = useState('students')
  const [students, setStudents] = useState([])
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

    async function loadStudents() {
      try {
        const response = await apiFetch('/api/students', {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error()

        const data = await response.json()
        if (!controller.signal.aborted) setStudents(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load students. Check the backend and try again.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadStudents()
    return () => controller.abort()
  }, [refreshCount])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  function resetForm() {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  function startEdit(student) {
    setForm({
      name: student.name ?? '',
      rollNumber: student.rollNumber ?? '',
      email: student.email ?? '',
    })
    setEditingId(student.id)
    setError('')
    setMessage('')
    document.getElementById('student-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy || loading) return

    const details = {
      name: form.name.trim(),
      rollNumber: form.rollNumber.trim(),
      email: form.email.trim(),
    }

    setError('')
    setMessage('')

    if (!details.name || !details.rollNumber || !details.email) {
      setError('Please fill in all three fields.')
      return
    }

    setBusy(true)

    try {
      const isEditing = editingId !== null
      const response = await apiFetch(
        isEditing ? `/api/students/${editingId}` : '/api/students',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(details),
        },
      )

      if (!response.ok) throw new Error()
      const savedStudent = await response.json()

      setStudents((previous) =>
        isEditing
          ? previous.map((student) =>
              student.id === editingId ? savedStudent : student,
            )
          : [...previous, savedStudent],
      )

      resetForm()
      setMessage(
        isEditing
          ? 'Student updated successfully!'
          : 'Student added successfully!',
      )
    } catch {
      setError('Could not save student. Check the backend and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteStudent(student) {
    if (busy || loading) return
    if (!window.confirm(`Delete ${student.name}?`)) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error()

      setStudents((previous) =>
        previous.filter((item) => item.id !== student.id),
      )

      if (editingId === student.id) resetForm()
      setMessage('Student deleted successfully!')
    } catch {
      setError('Could not delete student. Check the backend and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="teacher-app">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Teacher Workspace</p>
          <h1>Classroom Management</h1>
          <p>Manage your classroom from one place.</p>
        </div>

        <div className="student-count">
          <strong>{loading ? '…' : students.length}</strong>
          <span>Students</span>
        </div>
      </div>

      <nav className="module-nav" aria-label="Classroom modules">
        {pages.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={page === key ? 'module-button active' : 'module-button'}
            aria-current={page === key ? 'page' : undefined}
            disabled={busy}
            onClick={() => setPage(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {loading && <p role="status">Loading student information...</p>}

      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => setRefreshCount((current) => current + 1)}
          >
            Reload Students
          </button>
        </div>
      )}

      {page === 'students' && (
        <div className="module-content">
          <h2 id="student-form">
            {editingId !== null ? 'Edit Student' : 'Add Student'}
          </h2>

          <form onSubmit={handleSubmit}>
            <fieldset disabled={busy || loading}>
              <div className="student-form-grid">
                <p>
                  <label htmlFor="name">Student Name</label>
                  <br />
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={255}
                    required
                  />
                </p>

                <p>
                  <label htmlFor="rollNumber">Roll Number</label>
                  <br />
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    value={form.rollNumber}
                    onChange={handleChange}
                    maxLength={255}
                    required
                  />
                </p>

                <p>
                  <label htmlFor="email">Email</label>
                  <br />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={255}
                    required
                  />
                </p>
              </div>

              <button type="submit">
                {busy
                  ? 'Please wait...'
                  : editingId !== null
                    ? 'Save Changes'
                    : 'Add Student'}
              </button>

              {editingId !== null && (
                <button type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </fieldset>
          </form>

          {message && <p role="status">{message}</p>}

          <h2>Students</h2>

          {!loading && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.name}</td>
                      <td>{student.rollNumber}</td>
                      <td>{student.email}</td>
                      <td>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(student)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteStudent(student)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {students.length === 0 && (
                    <tr>
                      <td colSpan={5}>No students to display.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && !error && page === 'attendance' && (
        <Attendance students={students} />
      )}
      {page === 'attendance-report' && <AttendanceReport />}
      {!loading && !error && page === 'grades' && (
        <Gradebook students={students} />
      )}
      {!loading && !error && page === 'progress' && (
        <ProgressReport students={students} />
      )}
      {page === 'lessons' && <LessonPlans />}
      {page === 'assignments' && <Assignments />}
      {page === 'schedules' && <ClassSchedules />}
    </main>
  )
}