
"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Send, UserCircle } from 'lucide-react';
import { mockCodeDiscussions, mockCollaborators } from '@/lib/mock-data';
import type { ChatMessage, CodeDiscussion } from '@/types';

const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  return (
    <div className="flex items-start space-x-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.user.avatarUrl} alt={message.user.name} data-ai-hint={message.user.avatarHint || 'person avatar'} />
        <AvatarFallback>
          <UserCircle className="h-5 w-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 bg-[hsl(var(--background))] p-2 rounded-md shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-primary">{message.user.name}</span>
          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
        </div>
        <p className="text-sm text-foreground">{message.content}</p>
      </div>
    </div>
  );
};

const CodeDiscussionItem: React.FC<{ discussion: CodeDiscussion }> = ({ discussion }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(discussion.messages);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    const currentUser = mockCollaborators[0]; // Simulate current user
    const message: ChatMessage = {
      id: `m${messages.length + 1}`,
      user: { name: currentUser.name, avatarUrl: currentUser.avatarUrl, avatarHint: currentUser.avatarHint },
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <Card className="mb-6 bg-card border-border shadow-md">
      <CardContent className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Code Snippet ({discussion.language}):</h4>
        <pre className="bg-[hsl(var(--background))] p-3 rounded-md text-xs text-foreground overflow-x-auto mb-3 font-code">
          <code>{discussion.codeSnippet}</code>
        </pre>
        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto pr-1">
          {messages.map(msg => (
            <ChatMessageItem key={msg.id} message={msg} />
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-[hsl(var(--input))] text-foreground focus:ring-primary min-h-[40px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button size="icon" onClick={handleSendMessage} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function CodeChat() {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {mockCodeDiscussions.map(discussion => (
          <CodeDiscussionItem key={discussion.id} discussion={discussion} />
        ))}
      </div>
    </ScrollArea>
  );
}
