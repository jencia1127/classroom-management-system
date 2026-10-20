import { useEffect, useState } from 'react'
import { apiFetch } from './api'

function percentage(value) {
  return value == null ? 'Not available' : `${value.toFixed(2)}%`
}

export default function StudentPortal() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setData(null)

    async function loadPortal() {
      try {
        const responses = await Promise.all([
          apiFetch('/api/my/progress', { signal: controller.signal }),
          apiFetch('/api/assignments', { signal: controller.signal }),
          apiFetch('/api/schedules', { signal: controller.signal }),
        ])

        if (responses.some((response) => !response.ok)) {
          throw new Error('Could not load student information.')
        }

        const [report, assignments, schedules] = await Promise.all(
          responses.map((response) => response.json()),
        )

        if (!controller.signal.aborted) {
          setData({ report, assignments, schedules })
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load your portal. Try refreshing or logging in again.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadPortal()
    return () => controller.abort()
  }, [refreshCount])

  return (
    <main>
      <h1>Student Portal</h1>

      <button
        type="button"
        disabled={loading}
        onClick={() => setRefreshCount((current) => current + 1)}
      >
        Refresh Portal
      </button>

      {loading && <p>Loading your information...</p>}
      {error && <p role="alert">{error}</p>}

      {data && !loading && !error && (
        <>
          <section>
            <h2>{data.report.name}</h2>
            <p>Roll Number: {data.report.rollNumber}</p>
            <p>Email: {data.report.email}</p>

            <h3>My Attendance</h3>
            <p>Marked days: {data.report.markedDays}</p>
            <p>Present: {data.report.presentDays}</p>
            <p>Absent: {data.report.absentDays}</p>
            <p>
              Attendance: {percentage(data.report.attendancePercentage)}
            </p>
            <p>Attendance uses only days marked.</p>

            <h3>My Marks</h3>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Assessment</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.report.assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.subject}</td>
                    <td>{assessment.assessment}</td>
                    <td>
                      {assessment.marksObtained} / {assessment.maximumMarks}
                    </td>
                    <td>{percentage(assessment.percentage)}</td>
                    <td>{assessment.letterGrade}</td>
                  </tr>
                ))}
                {data.report.assessments.length === 0 && (
                  <tr>
                    <td colSpan={5}>No marks recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <p>
              <strong>Overall Percentage:</strong>{' '}
              {percentage(data.report.overallPercentage)}
            </p>
            <p>
              <strong>Overall Grade:</strong>{' '}
              {data.report.overallGrade ?? 'Not available'}
            </p>
          </section>

          <section>
            <h2>Assignments</h2>
            <table>
              <thead>
                <tr>
                  <th>Due Date</th>
                  <th>Subject</th>
                  <th>Title</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {[...data.assignments]
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.dueDate}</td>
                      <td>{assignment.subject}</td>
                      <td>{assignment.title}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>
                        {assignment.instructions}
                      </td>
                    </tr>
                  ))}
                {data.assignments.length === 0 && (
                  <tr>
                    <td colSpan={4}>No assignments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section>
            <h2>Class Timetable</h2>
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Subject</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {data.schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>{schedule.dayOfWeek}</td>
                    <td>{schedule.subject}</td>
                    <td>{schedule.startTime.slice(0, 5)}</td>
                    <td>{schedule.endTime.slice(0, 5)}</td>
                    <td>{schedule.room}</td>
                  </tr>
                ))}
                {data.schedules.length === 0 && (
                  <tr>
                    <td colSpan={5}>No classes scheduled yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  )
}