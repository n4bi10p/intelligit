"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Send, UserCircle, MessageSquareText } from 'lucide-react'; // Added MessageSquareText
import { mockCodeDiscussions, mockCollaborators } from '@/lib/mock-data';
import type { ChatMessage, CodeDiscussion, Collaborator } from '@/types'; // Added Collaborator
// Firebase imports
import { ref, onValue, push, set, serverTimestamp, off } from "firebase/database"; // Removed getDatabase, added off
import { db as database } from '@/firebase/firebase'; // Ensure this line exists and imports your initialized db

// REMOVE THIS LINE: const db = getDatabase();

const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  // ...existing ChatMessageItem code...
  // Ensure timestamp formatting is robust
  const displayTimestamp = typeof message.timestamp === 'number'
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : (typeof message.timestamp === 'string' ? message.timestamp : 'Invalid date');

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
          <span className="text-sm font-medium text-primary">{message.user.name || 'Unknown User'}</span>
          <span className="text-xs text-muted-foreground">
            {displayTimestamp}
          </span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

const CodeDiscussionItem: React.FC<{ discussion: CodeDiscussion }> = ({ discussion }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(discussion.messages || []);
  const currentUser: Collaborator | undefined = mockCollaborators[0];

  useEffect(() => {
    if (!discussion.id) {
      console.warn("CodeDiscussionItem: discussion.id is missing", discussion);
      return;
    }
    // Use the imported 'database' instance
    const messagesRef = ref(database, `codeDiscussions/${discussion.id}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(prevMessages => {
          const existingMessageIds = new Set(prevMessages.map(msg => msg.id));
          const firebaseMessages = Object.entries(data)
            .map(([key, value]: [string, any]) => ({
              id: key,
              content: value.content || '',
              timestamp: value.timestamp, // Keep as is from Firebase
              user: value.user || { name: 'Unknown User', avatarUrl: '', avatarHint: '?' }
            }))
            .filter(msg => !existingMessageIds.has(msg.id));
          
          if (firebaseMessages.length === 0) return prevMessages;
          
          const combinedMessages = [...prevMessages, ...firebaseMessages];
          return combinedMessages.sort((a, b) => {
            const timeA = typeof a.timestamp === 'number' ? a.timestamp : 0;
            const timeB = typeof b.timestamp === 'number' ? b.timestamp : 0;
            return timeA - timeB;
          });
        });
      } else {
        // If Firebase has no data for this discussion, retain existing (mock) messages
        // or set to empty if you prefer to clear them when Firebase has nothing.
        // For now, it retains discussion.messages if Firebase is empty.
      }
    }, (error) => {
      console.error(`Firebase onValue error for discussion ${discussion.id}:`, error);
    });
    
    return () => {
      off(messagesRef, 'value', unsubscribe); // Use off correctly
    };
  }, [discussion.id]);

  const handleSendMessage = useCallback(async () => { // Added useCallback
    if (newMessage.trim() === '' || !currentUser || !discussion.id) {
      if (!currentUser) console.error("Current user is undefined.");
      if (!discussion.id) console.error("Discussion ID is missing.");
      return;
    }

    try {
      // Use the imported 'database' instance
      const discussionMessagesRef = ref(database, `codeDiscussions/${discussion.id}/messages`);
      const newMessageRef = push(discussionMessagesRef);
      
      const messageData = {
        content: newMessage,
        timestamp: serverTimestamp(),
        user: {
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          avatarHint: currentUser.avatarHint
        }
      };
      
      await set(newMessageRef, messageData);
      
      // No need to manually add to local state here if onValue handles updates correctly
      // and serverTimestamp provides a good enough UX.
      // If immediate local update is desired before Firebase confirms, that's a separate pattern.
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [newMessage, currentUser, discussion.id]); // Added dependencies for useCallback

  return (
    <Card className="mb-6 bg-card border-border shadow-md">
      <CardContent className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Code Snippet ({discussion.language || 'N/A'} - {discussion.fileName || 'N/A'}):
        </h4>
        <pre className="bg-[hsl(var(--background))] p-3 rounded-md text-xs text-foreground overflow-x-auto mb-3 font-code">
          <code>{discussion.codeSnippet || '// No code snippet'}</code>
        </pre>
        <ScrollArea className="space-y-2 mb-3 max-h-60 overflow-y-auto pr-1 border rounded-md p-2">
          {messages && messages.length > 0 ? (
            messages.map(msg => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No messages yet. Start the conversation!</p>
          )}
        </ScrollArea>
        
        <div className="flex items-center space-x-2">
          <Textarea
            placeholder={currentUser ? "Type your message..." : "User not identified"}
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
            disabled={!currentUser}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!currentUser || newMessage.trim() === ''}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function CodeChat() {
  // console.log("CodeChat rendering, mockCodeDiscussions:", mockCodeDiscussions); // Keep for debugging
  
  try {
    return (
      <div className="w-full h-full bg-background">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {Array.isArray(mockCodeDiscussions) && mockCodeDiscussions.length > 0 ? (
              mockCodeDiscussions.map(discussion => {
                if (!discussion || !discussion.id) {
                  console.warn("Invalid discussion item:", discussion);
                  return null;
                }
                return (
                  <CodeDiscussionItem key={discussion.id} discussion={discussion} />
                );
              })
            ) : (
              <div className="flex justify-center items-center h-[300px] border border-dashed border-muted-foreground/50 rounded-lg">
                <div className="text-center p-4">
                  <MessageSquareText className="h-10 w-10 text-muted-foreground mx-auto mb-2" /> {/* Changed Icon */}
                  <p className="font-medium text-foreground">No code discussions available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ensure `mockCodeDiscussions` in `src/lib/mock-data.ts` is populated.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  } catch (error) {
    console.error("Error rendering CodeChat:", error);
    return (
      <div className="p-6 text-destructive bg-destructive/10 rounded-md m-4">
        <h3 className="font-bold mb-2">Something went wrong rendering CodeChat</h3>
        <p className="text-sm">{String(error)}</p>
        <p className="text-xs mt-2">Check browser console for more details.</p>
      </div>
    );
  }
}
