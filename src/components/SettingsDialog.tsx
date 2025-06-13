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
  repoInput, // This will now be primarily controlled by the Combobox selection
  setRepoInput, // This will be called by the Combobox
  onConnect,
  userRepositories,
  isFetchingUserRepos,
  onRepoSelect, // This might be redundant if setRepoInput handles the selection directly
  error,
  isLoading,
}) => {
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <ShadDialog open={open} onOpenChange={onOpenChange}>
      <ShadDialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Connect to Repository</DialogTitle>
          <DialogDescription>
            Search and select a repository. GitHub authentication is handled by the extension.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4"> 
            <Label htmlFor="repoCombobox" className="sr-only"> 
              Repository
            </Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between"
                  disabled={isFetchingUserRepos || isLoading}
                >
                  {repoInput
                    ? userRepositories.find((repo) => repo.full_name === repoInput)?.full_name
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
                          onSelect={(currentValue: string) => { // Explicitly type currentValue
                            setRepoInput(currentValue === repoInput ? "" : currentValue);
                            // onRepoSelect(currentValue); // Call onRepoSelect if still needed
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              repoInput === repo.full_name ? "opacity-100" : "opacity-0"
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
