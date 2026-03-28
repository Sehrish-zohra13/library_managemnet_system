import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('liblink_theme') || 'dark';
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('liblink_notifications');
    return saved ? JSON.parse(saved) : { dueReminders: true, alerts: true };
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('liblink_language') || 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('liblink_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('liblink_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('liblink_language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const updateNotifications = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme, setTheme,
      notifications, updateNotifications,
      language, setLanguage,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
