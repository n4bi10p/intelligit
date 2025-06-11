import type { Collaborator, Activity, Task, CodeDiscussion, TaskStatus } from '@/types';
import { GitCommit, MessageCircle, CheckCircle, UserCircle } from 'lucide-react';

export const mockCollaborators: Collaborator[] = [
  { id: '1', name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/40x40.png', online: true, avatarHint: 'woman face' },
  { id: '2', name: 'Bob The Builder', avatarUrl: 'https://placehold.co/40x40.png', online: false, avatarHint: 'man construction' },
  { id: '3', name: 'Charlie Chaplin', avatarUrl: 'https://placehold.co/40x40.png', online: true, avatarHint: 'classic actor' },
  { id: '4', name: 'Diana Prince', avatarUrl: 'https://placehold.co/40x40.png', online: true, avatarHint: 'superhero woman' },
  { id: '5', name: 'Edward Scissorhands', avatarUrl: 'https://placehold.co/40x40.png', online: false, avatarHint: 'fantasy character' },
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    user: { name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/32x32.png', avatarHint: 'woman face' },
    action: 'committed changes to feature/new-sidebar',
    timestamp: '2 hours ago',
    icon: GitCommit,
  },
  {
    id: '2',
    user: { name: 'Bob The Builder', avatarUrl: 'https://placehold.co/32x32.png', avatarHint: 'man construction' },
    action: 'commented on "Fix login button alignment"',
    timestamp: '3 hours ago',
    icon: MessageCircle,
  },
  {
    id: '3',
    user: { name: 'Charlie Chaplin', avatarUrl: 'https://placehold.co/32x32.png', avatarHint: 'classic actor' },
    action: 'reviewed and approved "Refactor API services"',
    timestamp: '5 hours ago',
    icon: CheckCircle,
  },
  {
    id: '4',
    user: { name: 'Diana Prince', avatarUrl: 'https://placehold.co/32x32.png', avatarHint: 'superhero woman' },
    action: 'pushed new branch "hotfix/urgent-bug"',
    timestamp: '1 day ago',
    icon: GitCommit,
  },
];

export const mockTasks: Task[] = [
  { id: '1', title: 'Design new logo', status: 'To Do', assignee: mockCollaborators[0], priority: 'high' },
  { id: '2', title: 'Implement user authentication', status: 'In Progress', assignee: mockCollaborators[1], priority: 'high' },
  { id: '3', title: 'Write documentation for API', status: 'To Do', priority: 'medium' },
  { id: '4', title: 'Fix bug #1023 - UI glitch on mobile', status: 'In Progress', assignee: mockCollaborators[2] },
  { id: '5', title: 'Deploy version 1.2 to staging', status: 'Done', assignee: mockCollaborators[3], priority: 'low' },
  { id: '6', title: 'Setup CI/CD pipeline', status: 'Done', assignee: mockCollaborators[0] },
  { id: '7', title: 'Research new charting library', status: 'To Do' },
];

export const mockCodeDiscussions: CodeDiscussion[] = [
  {
    id: 'cd1',
    language: 'TypeScript',
    codeSnippet: `function example() {\n  console.log("Hello world");\n}`,
    messages: [
      { id: 'm1', user: mockCollaborators[0], content: "Should we add type checking here?", timestamp: "10:00 AM" },
      { id: 'm2', user: mockCollaborators[2], content: "Good idea. TypeScript or JSDoc?", timestamp: "10:05 AM" },
      { id: 'm3', user: mockCollaborators[0], content: "Let's go with TypeScript for consistency.", timestamp: "10:10 AM" },
    ],
  },
  {
    id: '2',
    fileName: 'styles.css',
    codeSnippet: `.button {\n  color: white;\n  background-color: blue;\n  padding: 10px 20px;\n}`,
    language: 'css',
    messages: [
      { id: 'm4', user: mockCollaborators[1], content: "Can we use theme variables for colors?", timestamp: "11:30 AM" },
    ],
  },
];
