"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGitHub, signOutUser } from '@/firebase/firebase';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react'; // Assuming you have lucide-react for icons

export const LoginButton: React.FC = () => {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      console.error("Error signing in with GitHub", error);
      // Handle error (e.g., show a toast notification)
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out", error);
      // Handle error
    }
  };

  if (loading) {
    return <Button disabled>Loading...</Button>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL && (
          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" />
        )}
        <span>{user.displayName || user.email}</span>
        <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
      </div>
    );
  }

  return (
    <Button onClick={handleSignIn}>
      <Github className="mr-2 h-4 w-4" /> Sign in with GitHub
    </Button>
  );
};
