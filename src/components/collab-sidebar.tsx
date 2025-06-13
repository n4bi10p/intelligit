"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, LogIn, LogOut, UserCircle } from 'lucide-react'; // Added LogIn, LogOut, UserCircle
import type { Collaborator, Contributor, Branch } from '@/types';
import { mockCollaborators } from '@/lib/mock-data'; // Using mock data

interface CollaboratorItemProps {
  contributor: Contributor;
  onContributorClick: (contributor: Contributor) => void;
}

const CollaboratorItem: React.FC<CollaboratorItemProps> = ({ contributor, onContributorClick }) => {
  return (
    <div 
      className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer"
      onClick={() => onContributorClick(contributor)} // Moved onClick here
    >
      <Avatar className="h-8 w-8">
        {contributor.avatar_url && <AvatarImage src={contributor.avatar_url} alt={contributor.login} />}
        <AvatarFallback>{contributor.login.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {contributor.name || contributor.login} 
        </p>
        {contributor.contributions !== undefined && (
          <p className="text-xs text-muted-foreground">
            Contributions: {contributor.contributions}
          </p>
        )}
      </div>
    </div>
  );
};

export interface CollabSidebarProps {
  contributors: Contributor[];
  onContributorClick: (contributor: Contributor) => void;
  onAddMemberClick: () => void;
  branches: Branch[];
  selectedBranch: string | null;
  onBranchChange: (branchName: string) => void;
  repositoryConnected: boolean;
  currentRepoName: string | null;
  currentRepoOwner: string | null;
  // New props for authentication
  isUserAuthenticated: boolean;
  githubUserName: string | null;
  githubUserAvatar: string | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export function CollabSidebar({
  contributors = [],
  onContributorClick,
  onAddMemberClick,
  branches,
  selectedBranch,
  onBranchChange,
  repositoryConnected,
  currentRepoName,
  currentRepoOwner,
  // New props
  isUserAuthenticated,
  githubUserName,
  githubUserAvatar,
  onLoginClick,
  onLogoutClick,
}: CollabSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContributors = mockCollaborators.filter(c => // This seems to be using mockCollaborators, should ideally use props.contributors
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 bg-[hsl(var(--background))] border-r border-border flex flex-col h-full p-3 space-y-3 shadow-md">
      {/* Profile Section */}
      <div className="pb-2 mb-2 border-b border-border">
        {isUserAuthenticated && githubUserName ? (
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              {githubUserAvatar && <AvatarImage src={githubUserAvatar} alt={githubUserName} />}
              <AvatarFallback>
                {githubUserName ? githubUserName.substring(0, 2).toUpperCase() : <UserCircle size={20} />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{githubUserName}</p>
              <Button variant="link" size="sm" onClick={onLogoutClick} className="p-0 h-auto text-xs text-muted-foreground hover:text-primary">
                <LogOut size={14} className="mr-1" /> Logout
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={onLoginClick}>
            <LogIn size={16} className="mr-2" />
            Login with GitHub
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search Contributors"
          className="pl-8 bg-[hsl(var(--input))] text-foreground focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-2">
          {contributors && contributors.length > 0 ? (
            contributors
              .filter(c => (c.name || c.login).toLowerCase().includes(searchTerm.toLowerCase())) // Filter actual contributors
              .map((contributor) => (
              <CollaboratorItem key={contributor.id || contributor.login} contributor={contributor} onContributorClick={onContributorClick} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-2">No contributors found or repository not connected.</p>
          )}
        </div>
      </ScrollArea>
      <Button 
        variant="outline" 
        className="w-full mt-auto bg-card hover:bg-muted border-primary text-primary hover:text-primary/90"
        onClick={onAddMemberClick} // Call the new handler
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Add Contributor
      </Button>
    </div>
  );
}
