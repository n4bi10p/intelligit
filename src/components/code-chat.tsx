"use client";

import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Changed from Textarea for a simpler chat input
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, UserCircle, Loader2, AlertTriangle } from 'lucide-react';

// Re-define ChatMessage to match the one in page.tsx
interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number | object; // Can be number (client) or ServerValue.TIMESTAMP (server)
  avatar?: string;
}

interface CodeChatProps {
  messages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSendChatMessage: () => void;
  isSendingChatMessage: boolean;
  chatError: string | null;
  currentUserName: string | null; // To identify the current user's messages
}

const ChatMessageItem: React.FC<{ message: ChatMessage; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
  const displayTimestamp = typeof message.timestamp === 'number'
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'sending...'; // Or handle serverTimestamp object if needed by converting to a placeholder

  return (
    <div className={`flex items-start space-x-3 py-2 ${isCurrentUser ? 'justify-end' : ''}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          {message.avatar && <AvatarImage src={message.avatar} alt={message.sender} />}
          <AvatarFallback>
            <UserCircle className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
      <div 
        className={`flex-grow-0 max-w-[70%] p-3 rounded-lg shadow-sm ${isCurrentUser ? 'bg-primary text-primary-foreground self-end' : 'bg-muted text-muted-foreground'}`}
      >
        {!isCurrentUser && (
            <p className="text-xs font-medium mb-1">{message.sender}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70'} text-right`}>
          {displayTimestamp}
        </p>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8 ml-3">
          {message.avatar && <AvatarImage src={message.avatar} alt={message.sender} />}
          <AvatarFallback>
            <UserCircle className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export function CodeChat({ 
  messages, 
  chatInput, 
  onChatInputChange, 
  onSendChatMessage, 
  isSendingChatMessage, 
  chatError,
  currentUserName
}: CodeChatProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (chatInput.trim()) {
        onSendChatMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-background">
      <h3 className="text-lg font-semibold mb-3 text-foreground border-b pb-2">Repository Chat</h3>
      <ScrollArea className="flex-grow mb-4 p-3 border rounded-md bg-card" ref={scrollAreaRef}>
        {messages.length === 0 && !chatError && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <UserCircle className="w-12 h-12 mb-2" />
            <p>No messages yet.</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.sender === currentUserName} />
        ))}
      </ScrollArea>
      {chatError && (
        <div className="mb-2 p-2 text-sm text-destructive-foreground bg-destructive rounded-md flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {chatError}
        </div>
      )}
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Type your message..."
          value={chatInput}
          onChange={onChatInputChange}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-input text-foreground focus:ring-primary"
          disabled={isSendingChatMessage || !currentUserName}
        />
        <Button 
          size="icon" 
          onClick={onSendChatMessage} 
          disabled={!chatInput.trim() || isSendingChatMessage || !currentUserName}
          aria-label="Send message"
        >
          {isSendingChatMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {!currentUserName && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Please log in to send messages.
        </p>
      )}
    </div>
  );
}
