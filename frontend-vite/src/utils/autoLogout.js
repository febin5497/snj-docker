// src/utils/autoLogout.js
let logoutTimer;
let activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];

export const startInactivityTimer = (onLogout, timeout = 5 * 60 * 1000) => {
  clearTimeout(logoutTimer);

  logoutTimer = setTimeout(() => {
    localStorage.removeItem('token');
    onLogout();
  }, timeout);

  activityEvents.forEach(event =>
    window.addEventListener(event, resetTimer)
  );
};

const resetTimer = () => {
  clearTimeout(logoutTimer);
  startInactivityTimer(() => window.location.href = '/');
};

export const stopInactivityTimer = () => {
  clearTimeout(logoutTimer);
  activityEvents.forEach(event =>
    window.removeEventListener(event, resetTimer)
  );
};
