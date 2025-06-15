"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PermissionLevel = 'pull' | 'push' | 'admin' | 'maintain' | 'triage';

export interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (username: string, permission: PermissionLevel) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onOpenChange,
  onAddMember,
  isLoading = false,
  error = null,
}) => {
  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('push');

  const handleSubmit = () => {
    if (username.trim()) {
      onAddMember(username.trim(), permission);
    }
  };

  React.useEffect(() => {
    if (!open) {
      setUsername('');
      setPermission('push');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member to Repository</DialogTitle>
          <DialogDescription>
            Enter the GitHub username and select their permission level.
            The token used must have admin rights on the repository.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username-invite" className="text-right">
              Username
            </Label>
            <Input
              id="username-invite"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. octocat"
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="permission-level" className="text-right">
              Permission
            </Label>
            <Select
              value={permission}
              onValueChange={(value: string) => setPermission(value as PermissionLevel)}
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select permission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pull">Pull (Read)</SelectItem>
                <SelectItem value="push">Push (Write)</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="maintain">Maintain</SelectItem>
                <SelectItem value="triage">Triage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="col-span-4 text-sm text-red-500 text-center">{error}</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isLoading || !username.trim()}>
            {isLoading ? "Sending Invitation..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
