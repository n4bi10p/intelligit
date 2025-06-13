"use client";

import React from 'react';
import {
  Dialog as ShadDialog, // Renamed to avoid conflict
  DialogContent as ShadDialogContent, // Renamed to avoid conflict
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming shadcn/ui select

interface RepositoryInfo {
  id: string | number;
  name: string;
  full_name: string; // format: "owner/repo"
  owner: {
    login: string;
  };
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoInput: string;
  setRepoInput: (value: string) => void;
  onConnect: () => void;
  userRepositories: RepositoryInfo[];
  isFetchingUserRepos: boolean;
  onRepoSelect: (selectedRepoFullName: string) => void;
  error: string | null; // For displaying connection errors
  isLoading: boolean; // For overall loading state after clicking connect
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  repoInput,
  setRepoInput,
  onConnect,
  userRepositories,
  isFetchingUserRepos,
  onRepoSelect,
  error,
  isLoading,
}) => {
  return (
    <ShadDialog open={open} onOpenChange={onOpenChange}>
      <ShadDialogContent className="sm:max-w-[480px]"> {/* Increased width slightly */}
        <DialogHeader>
          <DialogTitle>Connect to Repository</DialogTitle>
          <DialogDescription>
            Select a repository from the dropdown or enter the URL/owner/repo manually.
            GitHub authentication is handled by the extension.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {userRepositories && userRepositories.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="repoSelect" className="text-right">
                Select Repo
              </Label>
              <Select
                value={repoInput}
                onValueChange={(value) => {
                  if (value) {
                    onRepoSelect(value);
                  }
                }}
                disabled={isFetchingUserRepos}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={isFetchingUserRepos ? "Loading repos..." : "Select a repository"} />
                </SelectTrigger>
                <SelectContent>
                  {isFetchingUserRepos && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                  {!isFetchingUserRepos && userRepositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.full_name}>
                      {repo.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="repoUrl" className="text-right">
              Manual Entry
            </Label>
            <Input
              id="repoUrl"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              className="col-span-3"
              placeholder="owner/repo or GitHub URL"
            />
          </div>
          {error && (
            <div className="col-span-4 text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onConnect} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </ShadDialogContent>
    </ShadDialog>
  );
};
