// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [readingMode, setReadingMode] = useState(() =>
    localStorage.getItem('theme') === 'reading'
  );

  useEffect(() => {
    document.body.setAttribute('data-theme', readingMode ? 'reading' : 'light');
    localStorage.setItem('theme', readingMode ? 'reading' : 'light');
  }, [readingMode]);

  return (
    <ThemeContext.Provider value={{ readingMode, setReadingMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
