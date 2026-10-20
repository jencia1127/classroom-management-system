import { useEffect, useState } from 'react'
import { apiFetch } from './api'

function formatPercentage(value) {
  return value == null ? 'Not available' : `${value.toFixed(2)}%`
}

export default function ProgressReport({ students }) {
  const [studentId, setStudentId] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  const selectedStudent = students.find(
    (student) => String(student.id) === studentId,
  )
  const validStudentId = selectedStudent ? studentId : ''

  useEffect(() => {
    const controller = new AbortController()
    setReport(null)
    setError('')

    if (!validStudentId) {
      setLoading(false)
      return () => controller.abort()
    }

    setLoading(true)

    async function loadReport() {
      try {
        const response = await apiFetch(`/api/progress/${validStudentId}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load the report.')
        }

        const data = await response.json()
        if (!controller.signal.aborted) {
          setReport(data)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load the report. Check that the backend is running.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadReport()
    return () => controller.abort()
  }, [validStudentId, refreshCount])

  const visibleReport =
    report && String(report.studentId) === validStudentId ? report : null

  return (
    <section>
      <h2>Student Progress Report</h2>

      <p>
        <label htmlFor="progress-student">Select Student</label>
        <br />
        <select
          id="progress-student"
          value={validStudentId}
          onChange={(event) => {
            setStudentId(event.target.value)
            setReport(null)
            setError('')
          }}
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
        <button
          type="button"
          disabled={!validStudentId || loading}
          onClick={() => {
            setReport(null)
            setRefreshCount((current) => current + 1)
          }}
        >
          Refresh Report
        </button>
      </p>

      {students.length === 0 && <p>Add a student to view a progress report.</p>}
      {students.length > 0 && !validStudentId && (
        <p>Select a student to view their attendance and marks.</p>
      )}
      {validStudentId && loading && <p>Loading report...</p>}
      {validStudentId && error && <p role="alert">{error}</p>}

      {visibleReport && !loading && !error && (
        <div>
          <h3>{visibleReport.name}</h3>
          <p><strong>Roll Number:</strong> {visibleReport.rollNumber}</p>
          <p><strong>Email:</strong> {visibleReport.email}</p>

          <h3>Attendance Summary</h3>
          <p>Attendance percentage uses only days marked.</p>

          <table>
            <thead>
              <tr>
                <th>Marked Days</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{visibleReport.markedDays}</td>
                <td>{visibleReport.presentDays}</td>
                <td>{visibleReport.absentDays}</td>
                <td>
                  {formatPercentage(visibleReport.attendancePercentage)}
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Assessment Results</h3>

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
              {visibleReport.assessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td>{assessment.subject}</td>
                  <td>{assessment.assessment}</td>
                  <td>
                    {assessment.marksObtained} / {assessment.maximumMarks}
                  </td>
                  <td>{formatPercentage(assessment.percentage)}</td>
                  <td>{assessment.letterGrade}</td>
                </tr>
              ))}

              {visibleReport.assessments.length === 0 && (
                <tr>
                  <td colSpan={5}>No marks recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>

          <h3>Overall Result</h3>
          <p>
            <strong>Total Marks:</strong>{' '}
            {visibleReport.totalObtained} / {visibleReport.totalMaximum}
          </p>
          <p>
            <strong>Overall Percentage:</strong>{' '}
            {formatPercentage(visibleReport.overallPercentage)}
          </p>
          <p>
            <strong>Overall Grade:</strong>{' '}
            {visibleReport.overallGrade ?? 'Not available'}
          </p>
          <p>
            Overall percentage = total obtained marks ÷ total maximum marks × 100.
          </p>
        </div>
      )}
    </section>
  )
}