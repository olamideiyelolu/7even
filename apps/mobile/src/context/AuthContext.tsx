import React, { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { AuthResponse } from '../types/api';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  onboardingComplete: boolean;
  quizIntroAccepted: boolean;
  quizStartMode: 'fresh' | 'resume' | 'start_over';
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  acceptQuizIntro: () => void;
  setQuizStartMode: (mode: 'fresh' | 'resume' | 'start_over') => void;
  markOnboardingComplete: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [quizIntroAccepted, setQuizIntroAccepted] = useState(false);
  const [quizStartMode, setQuizStartModeState] = useState<'fresh' | 'resume' | 'start_over'>('fresh');

  const value = useMemo<AuthContextType>(
    () => ({
      accessToken,
      refreshToken,
      onboardingComplete,
      quizIntroAccepted,
      quizStartMode,
      async login(email, password) {
        const data = await apiRequest<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setQuizIntroAccepted(false);
        setQuizStartModeState('fresh');
      },
      async register(payload) {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },
      acceptQuizIntro() {
        setQuizIntroAccepted(true);
      },
      setQuizStartMode(mode) {
        setQuizStartModeState(mode);
      },
      markOnboardingComplete() {
        setOnboardingComplete(true);
      },
      logout() {
        setAccessToken(null);
        setRefreshToken(null);
        setOnboardingComplete(false);
        setQuizIntroAccepted(false);
        setQuizStartModeState('fresh');
      }
    }),
    [accessToken, refreshToken, onboardingComplete, quizIntroAccepted, quizStartMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
