'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  UserProfileData,
  subscribeToAuthState,
  syncUserProfileNode,
  loginWithEmailPassword,
  registerWithEmailPassword,
  loginWithGoogle,
  logoutUser,
  sendPasswordReset,
  deleteUserAccount,
} from '@/lib/firebase/auth';
import { UserSession } from '@/lib/auth';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfileData | null;
  session: UserSession;
  isLoading: boolean;
  loginEmail: typeof loginWithEmailPassword;
  registerEmail: typeof registerWithEmailPassword;
  loginGoogle: typeof loginWithGoogle;
  logout: typeof logoutUser;
  resetPassword: typeof sendPasswordReset;
  deleteAccount: typeof deleteUserAccount;
}

const defaultSession: UserSession = {
  role: 'ANONYMOUS',
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: defaultSession,
  isLoading: true,
  loginEmail: loginWithEmailPassword,
  registerEmail: registerWithEmailPassword,
  loginGoogle: loginWithGoogle,
  logout: logoutUser,
  resetPassword: sendPasswordReset,
  deleteAccount: deleteUserAccount,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const profileData = await syncUserProfileNode(fbUser);
          setProfile(profileData);
        } catch (err) {
          console.error('[AuthContext] Failed to sync profile node:', err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const session: UserSession = user && profile ? {
    userId: user.uid,
    pseudonymId: `pseudo_${user.uid.slice(0, 8)}`,
    role: profile.role || 'CITIZEN_MEMBER',
    communityId: Object.keys(profile.communityIds)[0] || 'comm_central',
    isAuthenticated: true,
  } : defaultSession;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        loginEmail: loginWithEmailPassword,
        registerEmail: registerWithEmailPassword,
        loginGoogle: loginWithGoogle,
        logout: logoutUser,
        resetPassword: sendPasswordReset,
        deleteAccount: deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
