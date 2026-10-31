import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verify server-side administrator role from public.admin_users
  const verifyAdminRole = async (userId) => {
    if (!userId || !supabase) {
      setIsAdmin(false);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error || !data) {
        console.warn('User is authenticated but not registered in admin_users:', error?.message);
        setIsAdmin(false);
        return false;
      }

      setIsAdmin(true);
      return true;
    } catch (err) {
      console.error('Admin role verification failure:', err);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // 1. Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        verifyAdminRole(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await verifyAdminRole(currentUser.id);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and key in .env.');
    }

    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    // Check admin authorization
    const isAuthorized = await verifyAdminRole(data.user.id);
    if (!isAuthorized) {
      // Sign out immediately if not authorized as admin
      await supabase.auth.signOut();
      const unauthorizedErr = new Error('Access denied: This account is not registered as an authorized store administrator.');
      setAuthError(unauthorizedErr.message);
      throw unauthorizedErr;
    }

    return data;
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        login,
        logout,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
