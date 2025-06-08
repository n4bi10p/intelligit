
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockTasks } from '@/lib/mock-data';
import type { Task, TaskStatus } from '@/types';
import { UserCircle } from 'lucide-react';

const priorityColors: Record<string, string> = {
  high: 'border-red-500',
  medium: 'border-yellow-500',
  low: 'border-green-500',
};

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const priorityClass = task.priority ? priorityColors[task.priority] : 'border-transparent';
  return (
    <Card className={`mb-3 bg-[hsl(var(--background))] border-border hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing border-l-4 ${priorityClass}`}>
      <CardContent className="p-3">
        <p className="text-sm font-medium text-foreground mb-1">{task.title}</p>
        {task.assignee && (
          <div className="flex items-center space-x-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} data-ai-hint={task.assignee.avatarHint || 'person avatar'}/>
              <AvatarFallback>
                <UserCircle className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TaskColumn: React.FC<{ title: TaskStatus; tasks: Task[] }> = ({ title, tasks }) => {
  return (
    <div className="flex-1 min-w-[280px] bg-card p-3 rounded-lg shadow">
      <h3 className="text-base font-semibold text-foreground mb-3 px-1">{title}</h3>
      <ScrollArea className="h-[calc(100vh-250px)] pr-2"> {/* Adjust height as needed */}
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </ScrollArea>
    </div>
  );
};

export function TasksBoard() {
  const columns: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="p-4 flex space-x-4 h-full overflow-x-auto">
      {columns.map(status => (
        <TaskColumn
          key={status}
          title={status}
          tasks={mockTasks.filter(task => task.status === status)}
        />
      ))}
    </div>
  );
}
