import type { Collaborator, Activity, Task, CodeDiscussion, TaskStatus } from '@/types';
import { GitCommit, MessageCircle, CheckCircle, UserCircle } from 'lucide-react';

export const mockCollaborators: Collaborator[] = [
  { id: '1', login: 'alice', name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/40x40.png', avatarHint: 'woman face' },
  { id: '2', login: 'bob', name: 'Bob The Builder', avatarUrl: 'https://placehold.co/40x40.png', avatarHint: 'man construction' },
  { id: '3', login: 'charlie', name: 'Charlie Chaplin', avatarUrl: 'https://placehold.co/40x40.png', avatarHint: 'classic actor' },
  { id: '4', login: 'diana', name: 'Diana Prince', avatarUrl: 'https://placehold.co/40x40.png', avatarHint: 'superhero woman' },
  { id: '5', login: 'edward', name: 'Edward Scissorhands', avatarUrl: 'https://placehold.co/40x40.png', avatarHint: 'fantasy character' },
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
  {
    id: 'TASK-8782',
    title: 'Implement OAuth 2.0 for GitHub API integration',
    status: 'In Progress', // Changed to In Progress
    priority: 'high',
    label: 'feature',
    description: 'Enhance security and reliability by implementing OAuth 2.0 for all GitHub API interactions. This involves updating the authentication flow, handling token refresh, and ensuring secure token storage.',
    assignee: { login: mockCollaborators[0].login, name: mockCollaborators[0].name, avatarUrl: mockCollaborators[0].avatarUrl }, // Adjusted to TaskAssignee
    reporter: { login: mockCollaborators[1].login, name: mockCollaborators[1].name, avatarUrl: mockCollaborators[1].avatarUrl }, // Adjusted to TaskAssignee
    dueDate: '2024-08-15',
    comments: [
      { id: 'CMT-1', user: { login: mockCollaborators[2].login, name: mockCollaborators[2].name, avatarUrl: mockCollaborators[2].avatarUrl }, text: 'Starting work on this. Will post updates.', timestamp: '2024-07-20T10:00:00Z' },
      { id: 'CMT-2', user: { login: mockCollaborators[0].login, name: mockCollaborators[0].name, avatarUrl: mockCollaborators[0].avatarUrl }, text: 'Blocked by API rate limits. Need to investigate.', timestamp: '2024-07-22T14:30:00Z' },
    ],
    attachments: [
      { name: 'oauth-spec.pdf', url: '#' }, // Removed id, type, size
    ],
    codeSnippet: `function example() {\\n  // console.log("Hello world");\\n}`,
  },
  {
    id: 'TASK-1234',
    title: 'Fix bug #1023 - UI glitch on mobile',
    status: 'In Progress', // Changed to In Progress
    priority: 'medium',
    label: 'bug',
    description: 'Resolve the UI glitch occurring on mobile devices for bug #1023. Ensure the layout is responsive and elements are properly aligned.',
    assignee: { login: mockCollaborators[1].login, name: mockCollaborators[1].name, avatarUrl: mockCollaborators[1].avatarUrl }, // Adjusted to TaskAssignee
    reporter: { login: mockCollaborators[3].login, name: mockCollaborators[3].name, avatarUrl: mockCollaborators[3].avatarUrl }, // Adjusted to TaskAssignee
    dueDate: '2024-07-30',
    comments: [
      { id: 'CMT-3', user: { login: mockCollaborators[1].login, name: mockCollaborators[1].name, avatarUrl: mockCollaborators[1].avatarUrl }, text: 'Reproduced the glitch on my device. Investigating the cause.', timestamp: '2024-07-25T09:00:00Z' },
      { id: 'CMT-4', user: { login: mockCollaborators[3].login, name: mockCollaborators[3].name, avatarUrl: mockCollaborators[3].avatarUrl }, text: 'Thanks for the update. Let me know if you need any help.', timestamp: '2024-07-25T10:00:00Z' },
    ],
    attachments: [],
    codeSnippet: `function fixBug() {\\n  // console.log("Fixing bug #1023");\\n}`,
  },
];

export const mockCodeDiscussions: CodeDiscussion[] = [
  {
    id: 'cd1',
    language: 'TypeScript',
    codeSnippet: `function example() {\n  console.log("Hello world");\n}`,
    messages: [
      { id: 'm1', user: { login: mockCollaborators[0].login, name: mockCollaborators[0].name, avatarUrl: mockCollaborators[0].avatarUrl }, content: "Should we add type checking here?", timestamp: "10:00 AM" },
      { id: 'm2', user: { login: mockCollaborators[2].login, name: mockCollaborators[2].name, avatarUrl: mockCollaborators[2].avatarUrl }, content: "Good idea. TypeScript or JSDoc?", timestamp: "10:05 AM" },
      { id: 'm3', user: { login: mockCollaborators[0].login, name: mockCollaborators[0].name, avatarUrl: mockCollaborators[0].avatarUrl }, content: "Let's go with TypeScript for consistency.", timestamp: "10:10 AM" },
    ],
  },
  {
    id: '2',
    codeSnippet: `.button {\n  color: white;\n  background-color: blue;\n  padding: 10px 20px;\n}`,
    language: 'css',
    messages: [
      { id: 'm4', user: { login: mockCollaborators[1].login, name: mockCollaborators[1].name, avatarUrl: mockCollaborators[1].avatarUrl }, content: "Can we use theme variables for colors?", timestamp: "11:30 AM" },
    ],
  },
];
