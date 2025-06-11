"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Commit } from "@/components/WebviewMessenger"; // Corrected import path using alias
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

interface ActivityFeedProps {
  commits: Commit[];
  commitCurrentPage: number;
  totalCommitPages: number;
  onCommitPageChange: (newPage: number) => void;
  onCommitClick: (commit: Commit) => void; // Added prop for commit click
}

export function ActivityFeed({ commits, commitCurrentPage, totalCommitPages, onCommitPageChange, onCommitClick }: ActivityFeedProps) {
  if (!commits || commits.length === 0) {
    return <p className="text-center text-gray-500">No activity to display. Connect to a GitHub repository to see commits.</p>;
  }

  const handlePreviousPage = () => {
    if (commitCurrentPage > 1) {
      onCommitPageChange(commitCurrentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (commitCurrentPage < totalCommitPages) {
      onCommitPageChange(commitCurrentPage + 1);
    }
  };

  return (
    <ScrollArea className="h-full w-full p-2">
      <div className="space-y-4 pr-4">
        {commits.map((commit) => (
          <Card 
            key={commit.hash} 
            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => onCommitClick(commit)} // Call onCommitClick when card is clicked
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{commit.subject}</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {commit.authorName} committed on {new Date(commit.date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 pt-0">
              <p>Commit: {commit.hash.substring(0, 7)}</p>
              {commit.body && <p className="mt-1 whitespace-pre-wrap">{commit.body}</p>}
            </CardContent>
          </Card>
        ))}
        {totalCommitPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4 pb-4">
            <Button 
              onClick={handlePreviousPage} 
              disabled={commitCurrentPage <= 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {commitCurrentPage} of {totalCommitPages}
            </span>
            <Button 
              onClick={handleNextPage} 
              disabled={commitCurrentPage >= totalCommitPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
