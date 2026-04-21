import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark } from './colors';
import { getSetting, setSetting } from '../database/db';

const ThemeContext = createContext({ colors: light, mode: 'light', setMode: () => {} });

export const MODES = ['system', 'light', 'dark'];

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState('system'); // persisted preference

  // Load saved preference on mount
  useEffect(() => {
    getSetting('theme_mode').then((saved) => {
      if (saved && MODES.includes(saved)) setModeState(saved);
    });
  }, []);

  const setMode = async (newMode) => {
    setModeState(newMode);
    await setSetting('theme_mode', newMode);
  };

  // Resolve actual scheme
  const resolvedScheme =
    mode === 'system' ? (systemScheme || 'light') : mode;

  const colors = resolvedScheme === 'dark' ? dark : light;

  return (
    <ThemeContext.Provider value={{ colors, mode, setMode, resolvedScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
