import React, { useState, useEffect, useCallback, useMemo } from 'react';
import attendanceAPI from '../../api/attendance';
import api from '../../api/api';
import './AttendanceUnified.css';

const AttendanceUnified = () => {
  const userRole = localStorage.getItem('role') || 'staff';
  const userName = localStorage.getItem('username') || 'Employee';
  const userId = localStorage.getItem('userId');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentRecords, setRecentRecords] = useState([]);
  const [weekRecords, setWeekRecords] = useState([]);
  const [monthStats, setMonthStats] = useState({ present: 0, absent: 0, leave: 0, totalHours: 0 });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [showPhotoConfirm, setShowPhotoConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [teamToday, setTeamToday] = useState([]);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Elapsed time after punch-in
  useEffect(() => {
    if (!attendanceStatus?.punch_in_time || attendanceStatus?.punch_out_time) {
      setElapsedTime('00:00:00');
      return;
    }
    const interval = setInterval(() => {
      const inTime = new Date(attendanceStatus.punch_in_time);
      const diff = Date.now() - inTime.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [attendanceStatus?.punch_in_time, attendanceStatus?.punch_out_time]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statusRes, weekRes] = await Promise.all([
        attendanceAPI.getTodayStatus(),
        attendanceAPI.getRecentRecords(
          getWeekStart().toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ),
      ]);

      const status = statusRes.data;
      setAttendanceStatus({
        punch_in_time: status.punch_in_time || null,
        punch_out_time: status.punch_out_time || null,
        status: status.status,
        hours_worked: status.hours_worked,
      });

      // Parse week records
      const weekData = weekRes.data?.data || weekRes.data?.message || weekRes.data || [];
      if (Array.isArray(weekData)) {
        const flat = weekData.flatMap(s => (s.records || []).map(r => ({
          date: r.date,
          punchIn: r.punch_in_time,
          punchOut: r.punch_out_time,
          hours: r.hours_worked || 0,
          status: r.status || 'present',
        })));
        setWeekRecords(flat);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthRecs = flat.filter(r => new Date(r.date) >= monthStart);
        setMonthStats({
          present: monthRecs.filter(r => r.status === 'present' || r.status === 'completed').length,
          absent: monthRecs.filter(r => r.status === 'absent').length,
          leave: monthRecs.filter(r => r.status === 'leave').length,
          totalHours: monthRecs.reduce((sum, r) => sum + (r.hours || 0), 0),
        });
      }
    } catch {
      setError('Failed to load attendance data');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Fetch projects
  useEffect(() => {
    api.get('/api/projects').then(res => {
      const list = res.data?.data?.items || res.data?.data || res.data || [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  // Fetch team attendance for managers
  useEffect(() => {
    if (['admin', 'manager', 'super_admin'].includes(userRole)) {
      api.get('/api/attendance', { params: { start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] } })
        .then(res => {
          const items = res.data?.data?.items || res.data?.data || [];
          setTeamToday(Array.isArray(items) ? items : []);
        })
        .catch(() => {});
    }
  }, [userRole]);

  // Get GPS location
  const getGpsLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null),
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  // Handle photo capture
  const handlePhotoCapture = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target.result);
        setShowPhotoConfirm(true);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  // Punch in
  const handlePunchIn = useCallback(async () => {
    if (!photoFile) {
      handlePhotoCapture();
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const loc = await getGpsLocation();
      setGpsLocation(loc);
      await attendanceAPI.submitPunchInPhoto(photoFile, new Date().toISOString());
      setSuccess('Punched in successfully!');
      setShowPhotoConfirm(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error punching in: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [photoFile, handlePhotoCapture, getGpsLocation, fetchData]);

  // Confirm and punch in with photo
  const handleConfirmPunchIn = useCallback(async () => {
    await handlePunchIn();
  }, [handlePunchIn]);

  // Cancel photo
  const handleCancelPhoto = useCallback(() => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowPhotoConfirm(false);
  }, []);

  // Punch out
  const handlePunchOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await attendanceAPI.punchOut();
      setSuccess('Punched out successfully!');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error punching out: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  // Mark leave
  const handleMarkLeave = useCallback(async () => {
    try {
      setIsLoading(true);
      await attendanceAPI.markLeave('Leave marked from web');
      setSuccess('Leave marked successfully!');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to mark leave');
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  const isPunchedIn = !!attendanceStatus?.punch_in_time;
  const isPunchedOut = !!attendanceStatus?.punch_out_time;
  const isWorking = isPunchedIn && !isPunchedOut;

  const weekDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const rec = weekRecords.find(r => r.date === dateStr);
      days.push({
        date: d,
        dateStr,
        day: d.toLocaleDateString('en', { weekday: 'short' }),
        num: d.getDate(),
        status: rec?.status || (i === 0 ? null : 'absent'),
        hours: rec?.hours || 0,
        punchIn: rec?.punchIn,
        punchOut: rec?.punchOut,
      });
    }
    return days;
  }, [weekRecords]);

  const attendanceRate = useMemo(() => {
    const total = monthStats.present + monthStats.absent + monthStats.leave;
    return total > 0 ? Math.round((monthStats.present / total) * 100) : 0;
  }, [monthStats]);

  return (
    <div className="att-page">
      {/* Photo Confirmation Modal */}
      {showPhotoConfirm && photoPreview && (
        <div className="att-modal-overlay" onClick={handleCancelPhoto}>
          <div className="att-modal" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-header">
              <h3>Confirm Punch-In Photo</h3>
              <button className="att-modal-close" onClick={handleCancelPhoto}>×</button>
            </div>
            <div className="att-modal-body">
              <img src={photoPreview} alt="Punch-in" className="att-photo-preview" />
              {gpsLocation && (
                <div className="att-gps-info">
                  <span>📍 Location captured</span>
                  <span className="att-gps-coords">{gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}</span>
                </div>
              )}
            </div>
            <div className="att-modal-actions">
              <button className="att-btn att-btn-ghost" onClick={handleCancelPhoto} disabled={isLoading}>Retake</button>
              <button className="att-btn att-btn-primary" onClick={handleConfirmPunchIn} disabled={isLoading}>
                {isLoading ? 'Punching In...' : 'Confirm & Punch In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="att-header">
        <div className="att-header-content">
          <div className="att-header-left">
            <div className="att-header-badge">ATTENDANCE</div>
            <h1 className="att-header-title">Attendance Hub</h1>
            <p className="att-header-sub">Welcome back, {userName}</p>
          </div>
          <div className="att-header-right">
            <div className="att-clock">
              <div className="att-clock-time">{currentTime.toLocaleTimeString('en', { hour12: true })}</div>
              <div className="att-clock-date">{currentTime.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success */}
      {error && (
        <div className="att-alert att-alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="att-alert att-alert-success">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="att-grid">
        {/* Left Column: Punch Card + Stats */}
        <div className="att-col-left">
          {/* Punch Card */}
          <div className={`att-card att-punch-card ${isWorking ? 'att-punch-working' : ''}`}>
            <div className="att-punch-status-bar">
              <div className={`att-status-dot ${isWorking ? 'att-dot-active' : isPunchedOut ? 'att-dot-done' : 'att-dot-idle'}`} />
              <span className="att-status-label">
                {isWorking ? 'Working' : isPunchedOut ? 'Day Complete' : 'Ready'}
              </span>
            </div>

            {/* Elapsed Time */}
            {isWorking && (
              <div className="att-elapsed">
                <div className="att-elapsed-time">{elapsedTime}</div>
                <div className="att-elapsed-label">Time Worked Today</div>
              </div>
            )}

            {/* Punch In Time */}
            {isPunchedIn && (
              <div className="att-punch-times">
                <div className="att-punch-time-item">
                  <span className="att-punch-label">Punch In</span>
                  <span className="att-punch-value">{new Date(attendanceStatus.punch_in_time).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {isPunchedOut && (
                  <>
                    <div className="att-punch-divider" />
                    <div className="att-punch-time-item">
                      <span className="att-punch-label">Punch Out</span>
                      <span className="att-punch-value">{new Date(attendanceStatus.punch_out_time).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="att-punch-actions">
              {!isPunchedIn && !isPunchedOut && (
                <>
                  <button className="att-btn att-btn-punch-in att-btn-lg" onClick={handlePhotoCapture} disabled={isLoading}>
                    <span className="att-btn-icon">📸</span>
                    {isLoading ? 'Punching In...' : 'Punch In'}
                  </button>
                  <button className="att-btn att-btn-leave att-btn-sm" onClick={handleMarkLeave} disabled={isLoading}>
                    Mark Leave
                  </button>
                </>
              )}
              {isWorking && (
                <button className="att-btn att-btn-punch-out att-btn-lg" onClick={handlePunchOut} disabled={isLoading}>
                  <span className="att-btn-icon">⏹</span>
                  {isLoading ? 'Punching Out...' : 'Punch Out'}
                </button>
              )}
              {isPunchedOut && (
                <div className="att-completed-badge">
                  <span>✅</span> Day Completed
                </div>
              )}
            </div>

            {/* Project Selection */}
            {!isPunchedIn && projects.length > 0 && (
              <div className="att-project-select">
                <label>Project (optional)</label>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                  <option value="">No project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="att-stats-grid">
            <div className="att-stat-card att-stat-present">
              <div className="att-stat-icon">✓</div>
              <div className="att-stat-info">
                <div className="att-stat-value">{monthStats.present}</div>
                <div className="att-stat-label">Present This Month</div>
              </div>
            </div>
            <div className="att-stat-card att-stat-hours">
              <div className="att-stat-icon">⏱</div>
              <div className="att-stat-info">
                <div className="att-stat-value">{monthStats.totalHours.toFixed(1)}h</div>
                <div className="att-stat-label">Total Hours</div>
              </div>
            </div>
            <div className="att-stat-card att-stat-rate">
              <div className="att-stat-icon">📊</div>
              <div className="att-stat-info">
                <div className="att-stat-value">{attendanceRate}%</div>
                <div className="att-stat-label">Attendance Rate</div>
              </div>
            </div>
            <div className="att-stat-card att-stat-leave">
              <div className="att-stat-icon">🌴</div>
              <div className="att-stat-info">
                <div className="att-stat-value">{monthStats.leave}</div>
                <div className="att-stat-label">Leaves Taken</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Week View + Recent */}
        <div className="att-col-right">
          {/* Weekly Calendar */}
          <div className="att-card att-week-card">
            <h3 className="att-card-title">This Week</h3>
            <div className="att-week-grid">
              {weekDays.map((day, i) => (
                <div key={i} className={`att-week-day ${day.status === 'present' || day.status === 'completed' ? 'att-day-present' : day.status === 'leave' ? 'att-day-leave' : day.dateStr === new Date().toISOString().split('T')[0] ? 'att-day-today' : 'att-day-absent'}`}>
                  <div className="att-week-day-name">{day.day}</div>
                  <div className="att-week-day-num">{day.num}</div>
                  <div className="att-week-day-status">
                    {day.status === 'present' || day.status === 'completed' ? '✓' : day.status === 'leave' ? '🌴' : day.dateStr === new Date().toISOString().split('T')[0] && !day.status ? '•' : '✗'}
                  </div>
                  {day.hours > 0 && (
                    <div className="att-week-day-hours">{day.hours.toFixed(1)}h</div>
                  )}
                </div>
              ))}
            </div>
            <div className="att-week-legend">
              <span className="att-legend-item att-legend-present">✓ Present</span>
              <span className="att-legend-item att-legend-absent">✗ Absent</span>
              <span className="att-legend-item att-legend-leave">🌴 Leave</span>
              <span className="att-legend-item att-legend-today">• Today</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="att-card att-recent-card">
            <h3 className="att-card-title">Recent Activity</h3>
            <div className="att-recent-list">
              {recentRecords.length > 0 ? recentRecords.slice(0, 10).map((rec, i) => (
                <div key={i} className="att-recent-item">
                  <div className={`att-recent-dot ${rec.status === 'Present' ? 'att-dot-green' : 'att-dot-red'}`} />
                  <div className="att-recent-info">
                    <div className="att-recent-date">{rec.date}</div>
                    <div className="att-recent-time">
                      {rec.punchIn !== '—' ? `In: ${rec.punchIn}` : 'No punch in'}
                      {rec.punchOut !== '—' ? ` → Out: ${rec.punchOut}` : ''}
                    </div>
                  </div>
                  <div className="att-recent-hours">{rec.hours}</div>
                  <div className={`att-recent-badge att-badge-${rec.status.toLowerCase()}`}>{rec.status}</div>
                </div>
              )) : (
                <div className="att-empty">No recent records</div>
              )}
            </div>
          </div>

          {/* Team Today (Managers only) */}
          {['admin', 'manager', 'super_admin'].includes(userRole) && teamToday.length > 0 && (
            <div className="att-card att-team-card">
              <h3 className="att-card-title">Team Today ({teamToday.length})</h3>
              <div className="att-recent-list">
                {teamToday.slice(0, 10).map((rec, i) => (
                  <div key={i} className="att-recent-item">
                    <div className={`att-recent-dot ${rec.status === 'present' ? 'att-dot-green' : 'att-dot-red'}`} />
                    <div className="att-recent-info">
                      <div className="att-recent-date">Staff #{rec.staff_id}</div>
                      <div className="att-recent-time">
                        {rec.check_in ? `In: ${new Date(rec.check_in).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}` : 'Not punched in'}
                      </div>
                    </div>
                    <div className={`att-recent-badge att-badge-${rec.status}`}>{rec.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff));
}

export default AttendanceUnified;
