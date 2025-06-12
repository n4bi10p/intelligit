"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginButton } from "@/components/LoginButton";

interface LoginDialogProps {
  isOpen: boolean;
  // We might not need onOpenChange if it's always controlled by auth state
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen }) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing by clicking outside
      >
        <DialogHeader>
          <DialogTitle>Welcome to IntelliGit</DialogTitle>
          <DialogDescription>
            Please sign in with your GitHub account to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <LoginButton />
        </div>
      </DialogContent>
    </Dialog>
  );
};
