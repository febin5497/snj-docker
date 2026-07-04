import React, { useState, useEffect } from 'react';
import attendanceAPI from '../../api/attendance';
import './AttendanceUnified.css';
const AttendanceUnified = () => {
  // Get user info from localStorage
  const userRole = localStorage.getItem('role') || 'staff';
  const userName = localStorage.getItem('username') || 'Employee';
  // State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentRecords, setRecentRecords] = useState([]);
  const [error, setError] = useState(null);
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  // Fetch today's status
  useEffect(() => {
    fetchTodayStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchTodayStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  const fetchTodayStatus = async () => {
    try {
      setError(null);
      const response = await attendanceAPI.getTodayStatus();
      const status = response.data;
      setAttendanceStatus({
        punch_in_time: status.punch_in_time ? new Date(status.punch_in_time).toLocaleTimeString() : null,
        punch_out_time: status.punch_out_time ? new Date(status.punch_out_time).toLocaleTimeString() : null,
        status: status.status,
        message: status.message || 'Status updated'
      });
      // Fetch recent records (last 7 days)
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentRes = await attendanceAPI.getRecentRecords(
        sevenDaysAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      // Handle paginated response from BaseResourceRouter
      const recordsData = recentRes.data?.data || recentRes.data?.message || recentRes.data || [];
      if (Array.isArray(recordsData)) {
        const formattedRecords = recordsData.map(staffData => {
          const staffRecords = (staffData.records || []).slice(0, 7);
          return staffRecords.map(record => ({
            date: record.date,
            punchIn: record.punch_in_time ? new Date(record.punch_in_time).toLocaleTimeString() : '—',
            punchOut: record.punch_out_time ? new Date(record.punch_out_time).toLocaleTimeString() : '—',
            hours: record.hours_worked ? `${Math.floor(record.hours_worked)}h ${Math.round((record.hours_worked % 1) * 60)}m` : '-',
            status: record.status === 'completed' || record.status === 'present' ? 'Present' : record.status || 'Pending'
          }));
        }).flat();
        setRecentRecords(formattedRecords);
      } else {
        setRecentRecords([]);
      }
    } catch (error) {
      setError('Failed to fetch attendance status');
      // Set default status on error
      setAttendanceStatus({
        punch_in_time: null,
        punch_out_time: null,
        status: 'error',
        message: 'Unable to load status'
      });
    }
  };
  const handlePunchIn = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setIsLoading(true);
        setError(null);
        await attendanceAPI.submitPunchInPhoto(file, new Date().toISOString());
        await fetchTodayStatus();
      } catch (error) {
        setError('Error recording punch-in: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };
  const handlePunchOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await attendanceAPI.punchOut();
      setAttendanceStatus({
        punch_in_time: attendanceStatus.punch_in_time,
        punch_out_time: new Date().toLocaleTimeString(),
        status: 'punched_out',
        message: response.data.message || 'Punched out successfully'
      });
      alert('✓ Punch Out Successful!');
      // Refresh records
      await fetchTodayStatus();
    } catch (error) {
      setError('Error recording punch-out: ' + error.message);
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  // ===================================
  // FOR MANAGERS/ADMINS - SIMPLE BUTTON MODE
  // ===================================
  if (userRole === 'manager' || userRole === 'admin' || userRole === 'hr') {
    return (
      <div className="attendance-container">
        <div className="attendance-header">
          <h1>Quick Punch In/Out</h1>
          <p>Manager/Admin Mode - Simple Button Punch</p>
        </div>
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError(null)} className="ml-2 cursor-pointer">×</button>
          </div>
        )}
        <div className="current-time-section">
          <div className="time-display">
            <h2>{currentTime.toLocaleTimeString()}</h2>
            <p>{currentTime.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        {/* Manager/Admin Punch Card */}
        <div className="punch-card manager-mode">
          <h2>👤 {userName}</h2>
          <p className="role-badge">Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
          {/* Status Display */}
          <div className="status-display">
            {!attendanceStatus?.punch_in_time ? (
              <div className="status-message">
                <p>📍 Not Punched In</p>
                <p className="time-ready">Ready to punch in</p>
              </div>
            ) : !attendanceStatus?.punch_out_time ? (
              <div className="status-message active">
                <p>✓ Punched In</p>
                <p className="time-active">{attendanceStatus.punch_in_time}</p>
              </div>
            ) : (
              <div className="status-message completed">
                <p>✓✓ Day Completed</p>
                <p>In: {attendanceStatus.punch_in_time}</p>
                <p>Out: {attendanceStatus.punch_out_time}</p>
              </div>
            )}
          </div>
          {/* Simple Punch Buttons */}
          <div className="punch-buttons">
            {!attendanceStatus?.punch_in_time ? (
              <button
                className="btn btn-punch-in"
                onClick={handlePunchIn}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Punching In...' : '▶ PUNCH IN'}
              </button>
            ) : !attendanceStatus?.punch_out_time ? (
              <button
                className="btn btn-punch-out"
                onClick={handlePunchOut}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Punching Out...' : '⏹ PUNCH OUT'}
              </button>
            ) : (
              <button
                className="btn btn-completed"
                disabled
              >
                ✓ Completed
              </button>
            )}
          </div>
          <div className="manager-info">
            <p>📌 Manager/Admin Mode</p>
            <p>No photo verification required</p>
            <p>Simple one-click punch in/out</p>
          </div>
        </div>
        {/* Recent Attendance */}
        <div className="recent-section">
          <h3>Recent Attendance (Last 7 Days)</h3>
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.length > 0 ? recentRecords.map((record, idx) => (
                  <tr key={idx}>
                    <td>{record.date}</td>
                    <td>{record.punchIn}</td>
                    <td>{record.punchOut}</td>
                    <td>{record.hours}</td>
                    <td><span className="status-badge">{record.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="text-center text-muted py-6">No recent records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  // ===================================
  // FOR REGULAR STAFF - SIMPLIFIED (PHOTO MODE OPTIONAL)
  // ===================================
  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1>Attendance Management</h1>
        <p>Welcome, {userName}</p>
      </div>
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-2 cursor-pointer">×</button>
        </div>
      )}
      <div className="current-time-section">
        <div className="time-display">
          <h2>{currentTime.toLocaleTimeString()}</h2>
          <p>{currentTime.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      {/* Staff Punch Card */}
      <div className="punch-card staff-mode">
        <h2>Staff Punch In/Out</h2>
        {/* Status Display */}
        <div className="status-display">
          {!attendanceStatus?.punch_in_time ? (
            <div className="status-message">
              <p>📍 Not Punched In</p>
              <p className="time-ready">Ready to punch in</p>
            </div>
          ) : !attendanceStatus?.punch_out_time ? (
            <div className="status-message active">
              <p>✓ Punched In</p>
              <p className="time-active">{attendanceStatus.punch_in_time}</p>
            </div>
          ) : (
            <div className="status-message completed">
              <p>✓✓ Day Completed</p>
              <p>Hours: {attendanceStatus.hours || '—'}</p>
            </div>
          )}
        </div>
        {/* Staff Punch Buttons */}
        <div className="punch-buttons">
          {!attendanceStatus?.punch_in_time ? (
            <button
              className="btn btn-punch-in"
              onClick={handlePunchIn}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Punching In...' : '▶ PUNCH IN'}
            </button>
          ) : !attendanceStatus?.punch_out_time ? (
            <button
              className="btn btn-punch-out"
              onClick={handlePunchOut}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Punching Out...' : '⏹ PUNCH OUT'}
            </button>
          ) : (
            <button
              className="btn btn-completed"
              disabled
            >
              ✓ Completed
            </button>
          )}
        </div>
        <div className="staff-info">
          <p>📌 Staff Mode</p>
          <p>Click buttons to punch in and out</p>
        </div>
      </div>
      {/* Recent Attendance */}
      <div className="recent-section">
        <h3>Recent Attendance (Last 7 Days)</h3>
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.length > 0 ? recentRecords.map((record, idx) => (
                <tr key={idx}>
                  <td>{record.date}</td>
                  <td>{record.punchIn}</td>
                  <td>{record.punchOut}</td>
                  <td>{record.hours}</td>
                  <td><span className="status-badge">{record.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center text-muted py-6">No recent records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AttendanceUnified;
