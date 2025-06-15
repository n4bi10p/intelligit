export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Contributor {
  login: string;
  name?: string;
  avatar_url?: string;
  id?: number; 
  html_url?: string; 
  apiUrl?: string; 
  contributions?: number; 
  email?: string; 
}

export interface TaskAssignee {
  login: string; 
  name?: string;
  avatarUrl?: string;
  email?: string; 
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: TaskAssignee; 
  reporter?: TaskAssignee; 
  subtasks?: { id: string; title: string; completed: boolean }[];
  dueDate?: string;
  attachments?: { name: string; url: string }[]; 
  priority?: 'low' | 'medium' | 'high'; 
  label?: string; 
  comments?: { id: string; user: TaskAssignee; text: string; timestamp: string }[]; 
  codeSnippet?: string; 
}

// This Collaborator type is specifically for the mock data and local UI needs.
// It might differ from the Contributor type which is closer to GitHub API structure.
export interface Collaborator {
  id: string; // Local mock ID
  login: string; // Added login for consistency and to resolve errors
  name: string;
  avatarUrl?: string;
  avatarHint?: string;
}

export interface Activity {
  id: string;
  user: Pick<Collaborator, 'name' | 'avatarUrl' | 'avatarHint'>; // Uses the local Collaborator type
  action: string;
  timestamp: string;
  icon?: React.ElementType;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  name: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  user: Pick<Collaborator, 'name' | 'avatarUrl' | 'avatarHint'>; // Uses the local Collaborator type
  content: string;
  timestamp: string;
}

export interface CodeDiscussion {
  id: string;
  codeSnippet: string;
  language: string;
  messages: ChatMessage[];
}

export interface TaskStatusObject {
  id: string;
  name: TaskStatus;
  tasks: Task[];
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}
