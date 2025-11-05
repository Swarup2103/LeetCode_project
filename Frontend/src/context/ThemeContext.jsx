import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Default to 'light' or your custom dark theme
    return localStorage.getItem('codecraft-theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('codecraft-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    // Switch between 'light' and your new 'codecraftdark' theme
    setTheme(prev => prev === 'light' ? 'codecraftdark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
