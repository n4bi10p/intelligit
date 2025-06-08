
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

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee?: Pick<Collaborator, 'name' | 'avatarUrl' | 'avatarHint'>;
  priority?: 'low' | 'medium' | 'high';
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
