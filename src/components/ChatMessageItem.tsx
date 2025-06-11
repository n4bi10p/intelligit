"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import type { ChatMessage } from "@/types";

// Helper to format Firebase timestamp (can be kept here or imported from a shared utils file)
const formatFirebaseTimestamp = (timestamp: number | object): string => {
  if (typeof timestamp === "number") {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }); // Fallback
};

export interface CodeDiscussion {
  id: string;
  language?: string;
  fileName?: string; // Added fileName property
  codeSnippet?: string;
  // Potentially other existing properties
}
export const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  return (
    <div className="flex items-start space-x-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={message.user.avatarUrl}
          alt={message.user.name}
          data-ai-hint={message.user.avatarHint || "person avatar"}
        />
        <AvatarFallback>
          <UserCircle className="h-5 w-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 bg-[hsl(var(--background))] p-2 rounded-md shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-primary">{message.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {typeof message.timestamp === "number"
              ? formatFirebaseTimestamp(message.timestamp)
              : String(message.timestamp)}
          </span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};
