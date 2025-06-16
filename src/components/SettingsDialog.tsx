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
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command" // For searchable select
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover" // For searchable select
import { Check, ChevronsUpDown } from "lucide-react" // For searchable select icons
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils"; // For cn utility

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
  githubToken: string;
  onSaveToken: (token: string) => void;
  tokenStatus: string;
  repoInput: string;
  setRepoInput: (value: string) => void;
  onConnect: () => void;
  userRepositories: RepositoryInfo[];
  isFetchingUserRepos: boolean;
  onRepoSelect: (selectedRepoFullName: string) => void;
  error: string | null;
  isLoading: boolean;
}

export type { SettingsDialogProps }; // Export the props interface

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  githubToken,
  onSaveToken,
  tokenStatus,
  repoInput,
  setRepoInput,
  onConnect,
  userRepositories,
  isFetchingUserRepos,
  onRepoSelect,
  error,
  isLoading,
}) => {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [tokenInput, setTokenInput] = React.useState(githubToken || '');
  const [localTokenStatus, setLocalTokenStatus] = React.useState('');
  const [tokenVerified, setTokenVerified] = React.useState<boolean | null>(null); // null = not checked, true = valid, false = invalid
  const [tokenError, setTokenError] = React.useState<string | null>(null);
  const safeRepoInput = repoInput || '';

  React.useEffect(() => {
    // Listen for verification result from extension
    function handleMessage(event: MessageEvent) {
      const message = event.data;
      if (!message || !message.command) return;
      if (message.command === 'githubUserInfo') {
        if (message.userInfo) {
          setTokenVerified(true);
          setTokenError(null);
        } else {
          setTokenVerified(false);
          setTokenError(message.error || 'Token verification failed.');
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Save token to localStorage and call onSaveToken
  const handleSaveTokenClick = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('githubToken', tokenInput);
    }
    setLocalTokenStatus('Token saved!');
    setTimeout(() => setLocalTokenStatus(''), 2000);
    setTokenVerified(null); // Reset verification state
    setTokenError(null);
    if (onSaveToken) onSaveToken(tokenInput);
    // Request verification from extension
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ command: 'verifyGitHubToken', token: tokenInput }, '*');
    }
  };

  // Only show connected if repoInput is set and userRepositories is empty (i.e., repo is from workspace, not user selection)
  const isRepoConnected = !!safeRepoInput && !userRepositories.length;

  // Show repo name only (not owner/repo) if it's a local workspace repo
  const connectedRepoName = isRepoConnected
    ? (safeRepoInput.split('/').pop() || safeRepoInput)
    : safeRepoInput;

  return (
    <ShadDialog open={open} onOpenChange={onOpenChange}>
      <ShadDialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your GitHub authentication and repository connection.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* --- GitHub Token Input --- */}
          <div className="grid grid-cols-1 items-center gap-2 mb-2">
            <Label className="text-sm font-medium text-foreground">GitHub Token</Label>
            <Input
              type="password"
              value={tokenInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenInput(e.target.value)}
              placeholder="Paste your GitHub Personal Access Token"
              className="mt-1 bg-[hsl(var(--input))] text-foreground"
            />
            <Button
              type="button"
              className="mt-2 w-fit"
              onClick={handleSaveTokenClick}
              disabled={!tokenInput || !tokenInput.trim()}
            >Save Token</Button>
            {(tokenStatus || localTokenStatus) && <span className="ml-2 text-green-600 text-xs">{tokenStatus || localTokenStatus}</span>}
            {tokenVerified === true && <span className="ml-2 text-green-600 text-xs">Token verified!</span>}
            {tokenVerified === false && <span className="ml-2 text-red-600 text-xs">{tokenError || 'Token invalid.'}</span>}
          </div>
          {/* --- Repo Selection --- */}
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="repoCombobox" className="sr-only">Repository</Label>
            {isRepoConnected ? (
              <Button variant="outline" className="w-full cursor-default border-green-600 text-green-700 bg-green-50 hover:bg-green-100" disabled>
                Connected to: {connectedRepoName}
              </Button>
            ) : (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
                    disabled={isFetchingUserRepos || isLoading}
                  >
                    {safeRepoInput
                      ? userRepositories.find((repo) => repo.full_name === safeRepoInput)?.full_name || safeRepoInput
                      : (isFetchingUserRepos ? "Loading repositories..." : "Select repository...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[440px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search repository..." />
                    <CommandList>
                      <CommandEmpty>{isFetchingUserRepos ? "Loading..." : "No repository found."}</CommandEmpty>
                      <CommandGroup>
                        {userRepositories.map((repo) => (
                          <CommandItem
                            key={repo.id}
                            value={repo.full_name}
                            onSelect={(currentValue: string) => {
                              setRepoInput(currentValue === safeRepoInput ? "" : currentValue);
                              setPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                safeRepoInput === repo.full_name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {repo.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
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
          {!isRepoConnected && (
            <Button onClick={onConnect} disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          )}
        </DialogFooter>
      </ShadDialogContent>
    </ShadDialog>
  );
};
