'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import SessionTimeout from '@/components/SessionTimeout';



export type UserRole = 'admin' | 'main_manager' | 'branch_manager';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  branch_id?: string;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          // Check for network errors (TypeError: Failed to fetch)
          if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch failed')) {
            console.error('Network Error: Could not connect to Supabase. Using degraded mode.');
            // Return a minimal profile from session metadata if available
            return { id: userId, network_error: true } as any;
          }
          console.error('Error fetching profile:', error.message || JSON.stringify(error));
          return null;
        }
        return data as UserProfile;
      } catch (err: any) {
        if (err.message?.includes('Failed to fetch')) {
           return { id: userId, network_error: true } as any;
        }
        console.error('Unexpected error fetching profile', err);
        return null;
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // Stale or invalid refresh token — clear it so the user gets a clean state
          console.warn('Session error (clearing stored session):', error.message);
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Unexpected error during auth initialization, clearing session:', err);
        await supabase.auth.signOut();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Gracefully handle token refresh failures and explicit sign-outs
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        // TOKEN_REFRESHED fires when the client refreshes silently — only re-fetch
        // profile on the first SIGNED_IN or USER_UPDATED events
        if (event === 'TOKEN_REFRESHED') {
          // Session refresh succeeded — nothing to do unless user is null
          if (!session?.user) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          setLoading(true);
          const profile = await fetchProfile(session.user.id);
          // If profile fetch failed due to network, we can still use the session user id
          if (profile) {
            setUser(profile);
          } else {
             setUser(null);
          }
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/login', '/', '/forgot-password', '/verify', '/feedback'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Redirect unauthenticated users away from protected routes
    if (!user && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // Redirect authenticated users away from login/root to their dashboard
    if (user && (pathname === '/login' || pathname === '/')) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'main_manager') router.push('/manager');
      else if (user.role === 'branch_manager') router.push('/branch');
      else router.push('/login');
    }

    // Simple role protection for admin routes
    if (user && pathname.startsWith('/admin') && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {user && (user as any).network_error && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-sm font-bold shadow-lg animate-pulse z-[9999] sticky top-0">
          ⚠️ Network Connectivity Issue: Running in degraded mode. Some features may be unavailable.
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}
