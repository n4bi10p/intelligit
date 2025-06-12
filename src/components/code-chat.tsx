"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, UserCircle, MessageSquareText, PlusCircle, X, Loader2, Trash2 } from 'lucide-react'; // Added Trash2
import { mockCollaborators } from '@/lib/mock-data'; 
import type { ChatMessage, CodeDiscussion, Collaborator } from '@/types';
import { ref, onValue, push, set, serverTimestamp, off, remove } from "firebase/database"; // Added remove
import { db as database } from '@/firebase/firebase';

interface ChatMessageItemProps {
  message: ChatMessage;
  discussionId: string; // Need discussionId to construct Firebase path
  onDeleteMessage: (discussionId: string, messageId: string) => void;
  // Optional: Add currentUserId to only show delete for own messages
  // currentUserId?: string; 
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, discussionId, onDeleteMessage }) => {
  const displayTimestamp = typeof message.timestamp === 'number'
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : (typeof message.timestamp === 'string' ? message.timestamp : 'Invalid date');

  // Basic check: can this user delete this message?
  // For now, let's assume any user can delete any message for simplicity.
  // In a real app, you'd compare message.user.id with currentUserId.
  const canDelete = true; // Simplified for now

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      onDeleteMessage(discussionId, message.id);
    }
  };

  return (
    <div className="flex items-start space-x-3 py-2 group"> {/* Added group for hover effect */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.user.avatarUrl} alt={message.user.name} data-ai-hint={message.user.avatarHint || 'person avatar'} />
        <AvatarFallback>
          <UserCircle className="h-5 w-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 bg-[hsl(var(--background))] p-2 rounded-md shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-primary">{message.user.name || 'Unknown User'}</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {displayTimestamp}
            </span>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" // Show on hover
                onClick={handleDelete}
                title="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

// CodeDiscussionItem component
const CodeDiscussionItem: React.FC<{ discussion: CodeDiscussion }> = ({ discussion }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const currentUser: Collaborator | undefined = mockCollaborators[0]; // Assuming this is the current logged-in user

  useEffect(() => {
    if (!discussion.id) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }
    setIsLoadingMessages(true);
    const discussionMessagesRef = ref(database, `codeDiscussions/${discussion.id}/messages`);
    
    const unsubscribe = onValue(discussionMessagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedRealMessages: ChatMessage[] = [];

      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value && typeof value.content === 'string' && value.user) {
            loadedRealMessages.push({
              id: key,
              content: value.content,
              timestamp: value.timestamp,
              user: value.user || { name: 'Unknown User', avatarUrl: '', avatarHint: '?' }
            });
          }
        });
      }

      if (loadedRealMessages.length > 0) {
        loadedRealMessages.sort((a, b) => {
          const timeA = typeof a.timestamp === 'number' ? a.timestamp : 0;
          const timeB = typeof b.timestamp === 'number' ? b.timestamp : 0;
          return timeA - timeB;
        });
        setMessages(loadedRealMessages);
      } else {
        setMessages([]); 
      }
      setIsLoadingMessages(false);
    }, (error) => {
      console.error(`Firebase onValue error for discussion ${discussion.id} messages:`, error);
      setMessages([]); 
      setIsLoadingMessages(false);
    });
    
    return () => {
      off(discussionMessagesRef, 'value', unsubscribe);
    };
  }, [discussion.id]);

  const handleSendMessage = useCallback(async () => {
    if (newMessage.trim() === '' || !currentUser || !discussion.id) return;
    try {
      const discussionMessagesRef = ref(database, `codeDiscussions/${discussion.id}/messages`);
      const newMessageRef = push(discussionMessagesRef);
      const messageData = {
        content: newMessage,
        timestamp: serverTimestamp(),
        user: { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, avatarHint: currentUser.avatarHint } // Ensure user.id is saved
      };
      await set(newMessageRef, messageData);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [newMessage, currentUser, discussion.id]);

  const handleDeleteMessage = async (discussionId: string, messageId: string) => {
    if (!discussionId || !messageId) {
      console.error("Missing discussionId or messageId for deletion");
      return;
    }
    try {
      const messageRef = ref(database, `codeDiscussions/${discussionId}/messages/${messageId}`);
      await remove(messageRef);
      // Messages state will update automatically due to the onValue listener
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message.");
    }
  };

  // Determine header text
  let headerText;
  const lang = discussion.language || 'N/A';
  const file = discussion.fileName || 'N/A';

  if (lang === 'N/A' && file === 'N/A') {
    headerText = "Code Snippet (Java - He.java):";
  } else {
    headerText = `Code Snippet (${lang} - ${file}):`;
  }

  // Determine code snippet content
  const defaultJavaHelloWorld = `public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`;
  let displayCodeSnippet = discussion.codeSnippet || defaultJavaHelloWorld;

  if (displayCodeSnippet.trim().toLowerCase() === 'npm uninstall lucide-react') {
    displayCodeSnippet = `public class SimpleApp {\n    public static void main(String[] args) {\n        java.util.function.Function<String, String> greet = name -> "Hello, " + name + " from Java!";\n        System.out.println(greet.apply("User"));\n    }\n}`;
  } else if (!discussion.codeSnippet) { // Explicitly check if original snippet was empty
    // If the original snippet was empty, ensure the language in header reflects Java if we're showing Java Hello World
    if (lang === 'N/A' && file === 'N/A') {
        // headerText is already "Code Snippet (Java - He.java):"
    } else if (lang === 'N/A') {
        headerText = `Code Snippet (Java - ${file}):`;
    }
    // If language was already set, we keep it, even if showing Java Hello World as a fallback.
    // Or, you might decide to always override to Java if showing this specific fallback.
    // For now, only overriding if language was N/A.
  }


  return (
    <Card className="mb-6 bg-card border-border shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          {headerText}
        </h4>
        {/* Removed the discussion-level delete button if it was added previously */}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <pre className="bg-muted p-3 rounded-md text-xs text-foreground overflow-x-auto mb-3 font-code">
          <code>{displayCodeSnippet}</code>
        </pre>
        <ScrollArea className="space-y-2 mb-3 max-h-60 min-h-[80px] overflow-y-auto pr-1 border rounded-md p-2">
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full min-h-[50px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map(msg => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                discussionId={discussion.id!} // Pass discussionId
                onDeleteMessage={handleDeleteMessage} // Pass delete handler
                // Optional: currentUserId={currentUser?.id}
              />
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
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
            disabled={!currentUser}
          />
          <Button size="icon" onClick={handleSendMessage} disabled={!currentUser || newMessage.trim() === ''}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// CodeChat component (main logic for fetching all discussions, add new snippet form, etc.)
export function CodeChat() {
  const [allDiscussions, setAllDiscussions] = useState<CodeDiscussion[]>([]);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const discussionsRef = ref(database, 'codeDiscussions');
    setIsLoadingDiscussions(true);
    const unsubscribe = onValue(discussionsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedDiscussions: CodeDiscussion[] = [];
      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          loadedDiscussions.push({
            id: key,
            codeSnippet: value.codeSnippet || '',
            language: value.language || '',
            fileName: value.fileName || '',
            messages: value.messages || {} 
          });
        });
      }
      loadedDiscussions.sort((a, b) => b.id.localeCompare(a.id));
      setAllDiscussions(loadedDiscussions); 
      setIsLoadingDiscussions(false);
      setError(null);
    }, (firebaseError) => {
      console.error("Error fetching code discussions:", firebaseError);
      setError("Failed to load discussions. " + firebaseError.message);
      setIsLoadingDiscussions(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNewSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCodeSnippet.trim() === '') {
      alert("Code snippet cannot be empty.");
      return;
    }
    const newDiscussionData: Omit<CodeDiscussion, 'id' | 'messages'> = {
      codeSnippet: newCodeSnippet,
      language: newLanguage || 'plaintext',
      fileName: newFileName || 'untitled',
    };
    try {
      const discussionsRef = ref(database, 'codeDiscussions');
      const newDiscussionRef = push(discussionsRef); 
      await set(newDiscussionRef, newDiscussionData);
      setNewCodeSnippet('');
      setNewLanguage('');
      setNewFileName('');
      setShowAddForm(false);
    } catch (firebaseError: any) {
      console.error("Error adding new code snippet:", firebaseError);
      alert("Failed to add snippet: " + firebaseError.message);
    }
  };

  // Removed handleDeleteDiscussion as we are now deleting individual messages

  if (error) {
    return (
      <div className="p-6 text-destructive bg-destructive/10 rounded-md m-4">
        <h3 className="font-bold mb-2">Something went wrong</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full bg-background p-4 flex flex-col">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
          {showAddForm ? <X className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'Add Code Snippet'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Code Snippet</CardTitle>
          </CardHeader>
          <form onSubmit={handleAddNewSnippet}>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="newCodeSnippet" className="block text-sm font-medium text-muted-foreground mb-1">Code</label>
                <Textarea
                  id="newCodeSnippet"
                  placeholder="Paste your code here..."
                  value={newCodeSnippet}
                  onChange={(e) => setNewCodeSnippet(e.target.value)}
                  className="min-h-[100px] font-code"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newLanguage" className="block text-sm font-medium text-muted-foreground mb-1">Language</label>
                  <Input
                    id="newLanguage"
                    placeholder="e.g., javascript, python"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="newFileName" className="block text-sm font-medium text-muted-foreground mb-1">File Name (optional)</label>
                  <Input
                    id="newFileName"
                    placeholder="e.g., utils.js"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Add Snippet</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <ScrollArea className="flex-grow">
        {isLoadingDiscussions ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading discussions...</p>
          </div>
        ) : allDiscussions.length > 0 ? (
          allDiscussions.map(discussion => (
            <CodeDiscussionItem key={discussion.id} discussion={discussion} />
          ))
        ) : (
          <div className="flex flex-col justify-center items-center h-[200px] border border-dashed border-muted-foreground/50 rounded-lg p-4">
            <MessageSquareText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="font-medium text-foreground">No code discussions yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Code Snippet" to start a new discussion.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
