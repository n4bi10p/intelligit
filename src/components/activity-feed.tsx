
"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockActivities } from '@/lib/mock-data';
import type { Activity } from '@/types';
import { UserCircle } from 'lucide-react';

const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
  const IconComponent = activity.icon || UserCircle;
  return (
    <div className="flex items-start space-x-3 py-3 border-b border-border last:border-b-0">
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src={activity.user.avatarUrl} alt={activity.user.name} data-ai-hint={activity.user.avatarHint || 'person avatar'} />
        <AvatarFallback>
          <UserCircle className="h-5 w-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{activity.user.name}</span> {activity.action}
        </p>
        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
      </div>
      <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
    </div>
  );
};

export function ActivityFeed() {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-2">
        {mockActivities.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </ScrollArea>
  );
}
