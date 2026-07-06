import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (currentTheme) => {
      root.classList.remove('light', 'dark');
      
      let systemTheme = 'light';
      if (mediaQuery.matches) {
        systemTheme = 'dark';
      }
      
      const themeToApply = currentTheme === 'system' ? systemTheme : currentTheme;
      root.classList.add(themeToApply);
      
      // Update data attribute for dark mode libraries
      root.setAttribute('data-theme', themeToApply);
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // Watch for system theme changes if set to system
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: window.document.documentElement.classList.contains('dark') }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
