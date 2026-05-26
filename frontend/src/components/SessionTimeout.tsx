'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

// Timeout duration: 10 minutes (600,000 milliseconds)
const TIMEOUT_DURATION = 10 * 60 * 1000;

export default function SessionTimeout() {
  const router = useRouter();
  const { logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer on user activity
  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, TIMEOUT_DURATION);
  };

  const handleLogout = () => {
    // Clear session
    logout();
    // Clear stored tokens from sessionStorage (Supabase now uses sessionStorage)
    sessionStorage.clear();
    // Redirect to login page with timeout message
    router.push('/login?timeout=true');
  };

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
      'keyup',
      'wheel',
      'touchmove',
      'touchend',
    ];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Start timer on mount
    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
