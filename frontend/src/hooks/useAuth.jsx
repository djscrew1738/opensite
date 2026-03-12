/**
 * Authentication Hook
 * Provides authentication state and methods for the application
 * 
 * @module hooks/useAuth
 */

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {string} LocalStorage key for auth token */
const TOKEN_KEY = 'auth_token';

/** @type {string} LocalStorage key for user data */
const USER_KEY = 'user_data';

// ═══════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {{
 *   user: any | null,
 *   loading: boolean,
 *   error: string | null,
 *   login: (email: string, password: string) => Promise<any>,
 *   register: (userData: {username: string, email: string, password: string}) => Promise<any>,
 *   logout: () => void,
 *   isAuthenticated: boolean,
 *   clearError: () => void,
 * }} AuthContextValue
 */

/** @type {React.Context<AuthContextValue | null>} */
const AuthContext = createContext(null);

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Safely get item from localStorage
 * @param {string} key
 * @returns {string | null}
 */
function getStorageItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('localStorage access failed:', e);
    return null;
  }
}

/**
 * Safely set item in localStorage
 * @param {string} key
 * @param {string} value
 */
function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage access failed:', e);
  }
}

/**
 * Safely remove item from localStorage
 * @param {string} key
 */
function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('localStorage access failed:', e);
  }
}

/**
 * Parse JSON safely
 * @param {string | null} value
 * @returns {any | null}
 */
function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Provider Component
// ═══════════════════════════════════════════════════════════════

/**
 * Auth Provider Component
 * Wraps the app to provide authentication context
 * 
 * @param {{children: React.ReactNode}} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on mount if token exists
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      const token = getStorageItem(TOKEN_KEY);
      
      if (token) {
        try {
          const data = await api.auth.me();
          if (isMounted) {
            setUser(data.user);
            // Update stored user data
            setStorageItem(USER_KEY, JSON.stringify(data.user));
          }
        } catch (err) {
          console.error('Failed to restore session:', err.message);
          // Clear invalid token
          removeStorageItem(TOKEN_KEY);
          removeStorageItem(USER_KEY);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();
    
    return () => { 
      isMounted = false; 
    };
  }, []);

  /**
   * Login user with credentials
   * @param {string} email
   * @param {string} password
   * @returns {Promise<any>}
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    
    try {
      const data = await api.auth.login(email, password);
      
      // Store auth data
      setStorageItem(TOKEN_KEY, data.token);
      setStorageItem(USER_KEY, JSON.stringify(data.user));
      
      setUser(data.user);
      return data.user;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Register new user
   * @param {{username: string, email: string, password: string}} userData
   * @returns {Promise<any>}
   */
  const register = useCallback(async (userData) => {
    setError(null);
    
    try {
      const data = await api.auth.register(userData);
      
      // Store auth data
      setStorageItem(TOKEN_KEY, data.token);
      setStorageItem(USER_KEY, JSON.stringify(data.user));
      
      setUser(data.user);
      return data.user;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Logout current user
   */
  const logout = useCallback(() => {
    removeStorageItem(TOKEN_KEY);
    removeStorageItem(USER_KEY);
    setUser(null);
    setError(null);
    
    // Redirect to login
    window.location.href = '/login';
  }, []);

  /**
   * Clear any auth error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update user data (e.g., after profile update)
   * @param {any} updatedUser
   */
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    setStorageItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  // Memoized context value
  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    updateUser,
    isAuthenticated: !!user,
  }), [user, loading, error, login, register, logout, clearError, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.displayName = 'AuthProvider';

// ═══════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 * 
 * @returns {AuthContextValue}
 * @throws {Error} If used outside AuthProvider
 * 
 * @example
 * ```jsx
 * const { user, login, logout, isAuthenticated } = useAuth();
 * 
 * if (isAuthenticated) {
 *   return <div>Welcome, {user.name}</div>;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ═══════════════════════════════════════════════════════════════
// Utility Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to check if user has specific role
 * @param {string | string[]} roles - Required role(s)
 * @returns {boolean}
 */
export function useHasRole(roles) {
  const { user } = useAuth();
  
  if (!user?.role) return false;
  
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return requiredRoles.includes(user.role);
}

/**
 * Hook to get current user's display name
 * @returns {string}
 */
export function useUserDisplayName() {
  const { user } = useAuth();
  
  if (!user) return 'Guest';
  
  return user.displayName || user.name || user.username || user.email?.split('@')[0] || 'User';
}

/**
 * Hook to require authentication (redirects if not authenticated)
 * @param {{redirectTo?: string}} options
 * @returns {{isAuthenticated: boolean, isLoading: boolean}}
 */
export function useRequireAuth({ redirectTo = '/login' } = {}) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(redirectTo, { 
        replace: true,
        state: { from: location }
      });
    }
  }, [isAuthenticated, loading, navigate, redirectTo, location]);
  
  return { isAuthenticated, isLoading: loading };
}


