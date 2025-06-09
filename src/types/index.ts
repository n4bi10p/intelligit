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
