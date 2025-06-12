"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged, FirebaseUser } from '@/firebase/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: Error | null; // Added error field
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); // Added error state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        setError(null); // Clear error on auth state change
      },
      (authError) => { // Handle errors from onAuthStateChanged listener itself if any
        console.error("Auth state change error:", authError);
        setError(authError);
        setLoading(false);
        setUser(null);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}> {/* Updated value */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
