
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, UserCircle } from 'lucide-react';
import type { Collaborator } from '@/types';
import { mockCollaborators } from '@/lib/mock-data'; // Using mock data

interface CollaboratorItemProps {
  collaborator: Collaborator;
}

const CollaboratorItem: React.FC<CollaboratorItemProps> = ({ collaborator }) => {
  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-[hsl(var(--card))] rounded-md transition-colors cursor-pointer">
      <Avatar className="h-8 w-8">
        <AvatarImage src={collaborator.avatarUrl} alt={collaborator.name} data-ai-hint={collaborator.avatarHint || 'person avatar'} />
        <AvatarFallback>
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{collaborator.name}</p>
      </div>
      <div className={`h-2.5 w-2.5 rounded-full ${collaborator.online ? 'bg-green-400' : 'bg-slate-500'}`} title={collaborator.online ? 'Online' : 'Offline'}></div>
    </div>
  );
};

export function CollabSidebar() {
  const [searchTerm, setSearchTerm] = React.useState('');

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
          {filteredCollaborators.map(collaborator => (
            <CollaboratorItem key={collaborator.id} collaborator={collaborator} />
          ))}
        </div>
      </ScrollArea>
      <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
        <UserPlus className="mr-2 h-4 w-4" />
        Add Member
      </Button>
    </div>
  );
}
