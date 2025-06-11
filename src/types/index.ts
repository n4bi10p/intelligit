export interface Collaborator {
  id: string;
  name: string;
  avatarUrl: string;
  online: boolean;
  avatarHint?: string;
}

export interface Activity {
  id: string;
  user: Pick<Collaborator, 'name' | 'avatarUrl' | 'avatarHint'>;
  action: string;
  timestamp: string;
  icon?: React.ElementType;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  name: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee?: Pick<Collaborator, 'name' | 'avatarUrl' | 'avatarHint'>;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  subtasks?: Subtask[];
  dueDate?: string;
  attachments?: Attachment[];
}

export interface ChatMessage {
  id: string;
  user: Pick<Collaborator, 'name' | 'avatarUrl' | 'avatarHint'>;
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

export interface Contributor {
  id: number; // GitHub user ID
  login: string; // GitHub username
  name?: string; // Display name (often same as login or null from contributors API)
  avatar_url?: string;
  html_url?: string; // Link to GitHub profile
  apiUrl: string; // API URL to fetch full user details, e.g., https://api.github.com/users/{login}
  contributions?: number;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}
