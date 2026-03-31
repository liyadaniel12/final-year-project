'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

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
          console.error('Error fetching profile:', error);
          return null;
        }
        return data as UserProfile;
      } catch (err) {
        console.error('Unexpected error fetching profile', err);
        return null;
      }
    };

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setLoading(true);
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login';
    
    // Redirect if not logged in
    if (!user && !isAuthRoute) {
      router.push('/login');
      return;
    }

    // Redirect to respective dashboard if logged in and trying to access /login or root
    if (user && (isAuthRoute || pathname === '/')) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'main_manager') router.push('/manager');
      else if (user.role === 'branch_manager') router.push('/branch');
      else router.push('/login'); // Fallback if role missing
    }
    
    // Additional simple role protection
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
      {children}
    </AuthContext.Provider>
  );
}
