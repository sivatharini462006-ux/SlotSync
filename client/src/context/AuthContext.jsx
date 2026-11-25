import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('slotsync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('slotsync_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data.user);
        localStorage.setItem('slotsync_user', JSON.stringify(res.data.user));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('slotsync_token', jwtToken);
    localStorage.setItem('slotsync_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('slotsync_token', jwtToken);
    localStorage.setItem('slotsync_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('slotsync_token');
    localStorage.removeItem('slotsync_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);