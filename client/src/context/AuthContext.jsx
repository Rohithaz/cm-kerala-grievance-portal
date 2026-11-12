import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, initializeCsrf, loginUser, logoutUser, registerCitizen, updateProfile } from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const refreshUser = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
      return current;
    } catch (error) {
      if (error.status === 401) setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await initializeCsrf();
        const current = await getCurrentUser();
        if (active) setUser(current);
      } catch (error) {
        if (active && error.status !== 401) setAuthError('Authentication service is currently unavailable.');
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const register = useCallback(async (payload) => { await initializeCsrf(); return registerCitizen(payload); }, []);
  const login = useCallback(async (payload) => {
    await initializeCsrf();
    const result = await loginUser(payload);
    setUser(result.user);
    setAuthError('');
    return result.user;
  }, []);
  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setAuthError('');
  }, []);
  const saveProfile = useCallback(async (payload) => {
    const updated = await updateProfile(payload);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(() => ({ user, loading, authError, register, login, logout, refreshUser, saveProfile }), [
    user, loading, authError, register, login, logout, refreshUser, saveProfile,
  ]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}