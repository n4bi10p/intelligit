"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus } from 'lucide-react';
import type { Collaborator, Contributor } from '@/types';
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
  onContributorClick: (contributor: Contributor) => void; // Added this prop
  onAddMemberClick: () => void; // New prop for Add Member button click
}

export function CollabSidebar({ 
  contributors = [], 
  onContributorClick,
  onAddMemberClick // New prop
}: CollabSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCollaborators = mockCollaborators.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 bg-[hsl(var(--background))] border-r border-border flex flex-col h-full p-3 space-y-3 shadow-md">
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
            contributors.map((contributor) => (
              <CollaboratorItem key={contributor.id} contributor={contributor} onContributorClick={onContributorClick} />
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
