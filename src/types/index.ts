export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Contributor {
  login: string;
  name?: string;
  avatar_url?: string;
  id?: number; // Keeping id for now as it might be used elsewhere, but primary key is login
  html_url?: string; // Added
  apiUrl?: string; // Added
  contributions?: number; // Added
  // Add other fields from GitHub API as needed
}

export interface TaskAssignee {
  login: string;
  name?: string;
  avatarUrl?: string;
  avatarHint?: string; // Keep if used for AI hints, though ideally derived
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: TaskAssignee; // Updated to TaskAssignee
  subtasks?: { id: string; title: string; completed: boolean }[];
  dueDate?: string;
  attachments?: { name: string; url: string }[];
  // Add any other relevant fields
}

export interface Collaborator {
  id: string;
  name: string;
  avatarUrl?: string;
  avatarHint?: string;
}

export interface Activity {
  id: string;
  user: Pick<Collaborator, 'name' | 'avatarUrl' | 'avatarHint'>;
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

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}
