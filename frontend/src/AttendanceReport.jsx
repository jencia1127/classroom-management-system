import { useEffect, useState } from 'react'
import { apiFetch } from './api'

export default function AttendanceReport() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadReport() {
      setLoading(true)
      setError('')

      try {
        const response = await apiFetch('/api/attendance/report', {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error()
        setReports(await response.json())
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not load the report. Check the backend.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadReport()
    return () => controller.abort()
  }, [refreshCount])

  return (
    <section>
      <h2>Attendance Report</h2>
      <p>Percentage is calculated using marked days only.</p>

      <button
        type="button"
        disabled={loading}
        onClick={() => setRefreshCount((previous) => previous + 1)}
      >
        {loading ? 'Loading...' : 'Refresh Report'}
      </button>

      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll Number</th>
              <th>Marked Days</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.studentId}>
                <td>{report.name}</td>
                <td>{report.rollNumber}</td>
                <td>{report.markedDays}</td>
                <td>{report.presentDays}</td>
                <td>{report.absentDays}</td>
                <td>
                  {report.percentage === null
                    ? 'Not available'
                    : `${report.percentage.toFixed(2)}%`}
                </td>
              </tr>
            ))}

            {reports.length === 0 && (
              <tr>
                <td colSpan={6}>No students to display.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}