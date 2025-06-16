"use client"; // Required for useState and useEffect

import React, { useState, useEffect, useCallback } from 'react';
import { CollabSidebar } from '@/components/collab-sidebar';
import { MainPanel } from '@/components/main-panel';
import WebviewMessenger, { Commit } from '@/components/WebviewMessenger'; // Import Commit interface
import { db } from "@/firebase/firebase"; // Import Firebase db
import { ref, push, onValue, off, serverTimestamp, DataSnapshot, set, get } from "firebase/database"; // Firebase Realtime Database functions
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Contributor, Branch } from '@/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddMemberDialog, AddMemberDialogProps } from '@/components/AddMemberDialog';
import { SettingsDialog, type SettingsDialogProps } from '@/components/SettingsDialog'; // Import the new SettingsDialog and its props
import { LoginDialog } from '@/components/LoginDialog';

// Placeholder stub
async function checkIfCollaborator(owner: string, repo: string, username: string, token: string): Promise<boolean> {
  // console.warn(`[IntelliGit-Page] STUB: checkIfCollaborator(${owner}, ${repo}, ${username}, token) called, returning false.`);
  // In a real implementation, this would make an API call to GitHub
  // For example: GET /repos/{owner}/{repo}/collaborators/{username}
  // And check for a 204 status for collaborator, 404 for not.
  return false;
}

// Placeholder stub
async function addRepositoryCollaborator(owner: string, repo: string, username: string, permission: string, token: string): Promise<void> {
  // console.warn(`[IntelliGit-Page] STUB: addRepositoryCollaborator(${owner}, ${repo}, ${username}, ${permission}, token) called.`);
  // In a real implementation, this would make an API call to GitHub
  // For example: PUT /repos/{owner}/{repo}/collaborators/{username}
  // with a body like { permission: "pull" } (or "push", "admin", etc.)
  return;
}

interface RepositoryInfo {
  id: string | number;
  name: string;
  full_name: string; // format: "owner/repo"
  owner: {
    login: string;
  };
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number | object; // Can be number (client) or ServerValue.TIMESTAMP (server)
  avatar?: string;
}

// CommitDetailDialog component
const CommitDetailDialog: React.FC<{
  commit: Commit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ commit, open, onOpenChange }) => {
  if (!commit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Commit Details</DialogTitle>
          <DialogDescription>
            Viewing details for commit {commit.hash.substring(0, 7)}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-3">
          <div className="grid gap-3 py-4 text-sm">
            <div className="grid grid-cols-4 items-baseline gap-x-4 gap-y-1">
              <Label htmlFor="hash" className="text-right font-semibold col-span-1">Hash:</Label>
              <div id="hash" className="col-span-3 break-all bg-muted p-2 rounded-md">{commit.hash}</div>
            </div>
            <div className="grid grid-cols-4 items-baseline gap-x-4 gap-y-1">
              <Label htmlFor="author" className="text-right font-semibold col-span-1">Author:</Label>
              <div id="author" className="col-span-3 break-words">{commit.authorName} &lt;{commit.authorEmail}&gt;</div>
            </div>
            <div className="grid grid-cols-4 items-baseline gap-x-4 gap-y-1">
              <Label htmlFor="date" className="text-right font-semibold col-span-1">Date:</Label>
              <div id="date" className="col-span-3">{new Date(commit.date).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-4 items-baseline gap-x-4 gap-y-1">
              <Label htmlFor="subject" className="text-right font-semibold col-span-1">Subject:</Label>
              <div id="subject" className="col-span-3 bg-muted p-2 rounded-md break-words">{commit.subject}</div>
            </div>
            {commit.body && (
              <div className="grid grid-cols-4 items-start gap-x-4 gap-y-1">
                <Label htmlFor="message" className="text-right font-semibold col-span-1">Message:</Label>
                <div className="col-span-3 bg-muted p-2 rounded-md flex items-start">
                  <div id="message" className="whitespace-pre-wrap font-sans text-sm w-full">
                    {commit.body}
                  </div>
                </div>
              </div>
            )}
            {commit.parents && (
              <div className="grid grid-cols-4 items-baseline gap-x-4 gap-y-1">
                <Label htmlFor="parents" className="text-right font-semibold col-span-1">Parents:</Label>
                <div id="parents" className="col-span-3 break-all">{commit.parents}</div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ContributorDetailDialog component
const ContributorDetailDialog: React.FC<{
  contributor: Contributor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ contributor, open, onOpenChange }) => {
  if (!contributor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contributor Details</DialogTitle>
          <DialogDescription>
            Information for {contributor.name || contributor.login}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              {contributor.avatar_url && <AvatarImage src={contributor.avatar_url} alt={contributor.login} />}
              <AvatarFallback>{(contributor.name || contributor.login).substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="grid grid-cols-[max-content,1fr] items-center gap-x-3">
            <Label htmlFor="username" className="text-right font-semibold">Username:</Label>
            <div id="username" className="text-sm truncate">{contributor.login}</div>
          </div>
          <div className="grid grid-cols-[max-content,1fr] items-center gap-x-3">
            <Label htmlFor="name" className="text-right font-semibold">Name:</Label>
            <div id="name" className="text-sm truncate">{contributor.name || contributor.login}</div>
          </div>
          <div className="grid grid-cols-[max-content,1fr] items-center gap-x-3">
            <Label htmlFor="contributions" className="text-right font-semibold">Contributions:</Label>
            <div id="contributions" className="text-sm">{contributor.contributions}</div>
          </div>
          <div className="grid grid-cols-[max-content,1fr] items-center gap-x-3">
            <Label htmlFor="profile" className="text-right font-semibold">Profile:</Label>
            <a
              id="profile"
              href={contributor.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline truncate"
            >
              Link
            </a>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Define the vscodeApi for communication from iframe to parent (webview host)
const vscodeApiInstance = {
  postMessage: (message: any) => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      // console.log('[IntelliGit-Page] Posting message to parent (webview host):', message, 'Targeting parent origin: *');
      window.parent.postMessage(message, '*');
    } else {
      // console.warn('[IntelliGit-Page] window.parent is not available or is self. Cannot post message to extension host.');
    }
  }
};

export default function CodeCollabAIPage() {
  const [gitLog, setGitLog] = useState<Commit[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [isCommitDetailOpen, setIsCommitDetailOpen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [isContributorDetailOpen, setIsContributorDetailOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [repoInput, setRepoInput] = useState(''); // Used by SettingsDialog
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [autoDetectedOwner, setAutoDetectedOwner] = useState<string | null>(null);
  const [autoDetectedRepo, setAutoDetectedRepo] = useState<string | null>(null);
  const [gitLogError, setGitLogError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentRepoOwner, setCurrentRepoOwner] = useState<string | null>(null);
  const [currentRepoName, setCurrentRepoName] = useState<string | null>(null);
  const [repositoryConnected, setRepositoryConnected] = useState<boolean>(false);
  const [repositoryNameFromExtension, setRepositoryNameFromExtension] = useState<string | null>(null);
  const [currentBranchFromExtension, setCurrentBranchFromExtension] = useState<string | null>(null);
  const [repositoryInfoError, setRepositoryInfoError] = useState<string | null>(null);

  const [commitsPerPage] = useState<number>(30);
  const [commitCurrentPage, setCommitCurrentPage] = useState<number>(1);
  const [totalCommitPages, setTotalCommitPages] = useState<number>(1);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [userRepositories, setUserRepositories] = useState<RepositoryInfo[]>([]);
  const [isFetchingUserRepos, setIsFetchingUserRepos] = useState<boolean>(false);

  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false);
  const [githubUserName, setGithubUserName] = useState<string | null>(null);
  const [githubUserAvatar, setGithubUserAvatar] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  type PermissionLevel = 'pull' | 'push' | 'admin' | 'maintain' | 'triage';

  // Function to fetch GitHub user info
  const fetchGithubUserInfo = useCallback(async (token: string) => {
    if (!token) return;
    // console.log('[IntelliGit-Page] Fetching GitHub user info...');
    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
      };
      const response = await fetch('https://api.github.com/user', { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || 'Failed to fetch user info'}`);
      }
      const userData = await response.json();
      setGithubUserName(userData.login); // Or userData.name if preferred
      setGithubUserAvatar(userData.avatar_url);
      setIsUserAuthenticated(true);
      // console.log('[IntelliGit-Page] Successfully fetched GitHub user info for:', userData.login);
    } catch (error: any) {
      console.error('[IntelliGit-Page] Error fetching GitHub user info:', error);
      setErrorMessage(error.message || 'Failed to fetch user info.');
      setIsUserAuthenticated(false);
      setGithubUserName(null);
      setGithubUserAvatar(null);
    }
  }, [setGithubUserName, setGithubUserAvatar, setIsUserAuthenticated, setErrorMessage]);

  const fetchUserRepositories = useCallback(async (token: string) => {
    if (!token) return;
    // console.log('[IntelliGit-Page] Fetching user repositories...');
    setIsFetchingUserRepos(true);
    setErrorMessage(null);
    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
      };
      const response = await fetch('https://api.github.com/user/repos?type=owner&sort=updated&per_page=100', { headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || 'Failed to fetch user repositories'}`);
      }
      const data = await response.json();
      setUserRepositories(data as RepositoryInfo[]);
      // console.log('[IntelliGit-Page] Successfully fetched user repositories:', data.length);
    } catch (error: any) {
      console.error('[IntelliGit-Page] Error fetching user repositories:', error);
      setErrorMessage(error.message || 'Failed to fetch repositories.');
      setUserRepositories([]); // Clear previous list on error
    } finally {
      setIsFetchingUserRepos(false);
    }
  }, [setErrorMessage, setIsFetchingUserRepos, setUserRepositories]);

  // Chat: Function to get a sanitized repo ID for Firebase path
  const getRepoId = useCallback(() => {
    if (currentRepoOwner && currentRepoName) {
      return `${currentRepoOwner}_${currentRepoName}`.replace(/[^a-zA-Z0-9_\\-]/g, '-');
    }
    return null;
  }, [currentRepoOwner, currentRepoName]);

  // Chat: Function to send a message
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    if (!isUserAuthenticated || !githubUserName) {
      setChatError("You must be logged in to send messages.");
      return;
    }
    const repoId = getRepoId();
    if (!repoId) {
      setChatError("No repository selected to associate chat with.");
      return;
    }

    setIsSendingMessage(true);
    setChatError(null);

    const messageData = {
      text: chatInput,
      sender: githubUserName,
      avatar: githubUserAvatar || undefined,
      timestamp: serverTimestamp(),
    };

    try {
      const chatMessagesRef = ref(db, `chats/${repoId}`);
      await push(chatMessagesRef, messageData);
      setChatInput("");
      // console.log('[IntelliGit-Page] Chat message sent to Firebase for repo:', repoId);
    } catch (error: any) {
      console.error('[IntelliGit-Page] Error sending chat message:', error);
      setChatError(`Failed to send message: ${error.message}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Chat: Effect to fetch/listen for chat messages
  useEffect(() => {
    const repoId = getRepoId();
    if (!repoId || !repositoryConnected) {
      // console.log('[IntelliGit-Page] Chat: Not setting up Firebase listener, no repoId or not connected.');
      setChatMessages([]); // Clear messages if no repo or not connected
      return;
    }

    // console.log('[IntelliGit-Page] Setting up Firebase listener for chat messages for repo:', repoId);
    const chatMessagesRef = ref(db, `chats/${repoId}`);
    
    const listener = onValue(chatMessagesRef, (snapshot: DataSnapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({ id: childSnapshot.key!, ...childSnapshot.val() });
      });
      // Sort messages by timestamp, assuming timestamp is a number (Unix ms) or can be converted
      messages.sort((a, b) => (a.timestamp as number) - (b.timestamp as number));
      setChatMessages(messages);
    }, (error) => {
      console.error('[IntelliGit-Page] Firebase chat listener error:', error);
      setChatError(`Error fetching chat messages: ${error.message}`);
    });

    return () => {
      // console.log('[IntelliGit-Page] Removing Firebase chat listener for repo:', repoId);
      off(chatMessagesRef, 'value', listener);
    };
  }, [getRepoId, repositoryConnected, setChatMessages, setChatError]); // Added dependencies


  const handleMessage = useCallback((event: MessageEvent) => {
    const message = event.data;
    // Log origin to understand it better
    // console.log(`[IntelliGit-Page] Message received. Origin: ${event.origin}, Data:`, message);

    if (!message || !message.command) {
      return;
    }
    // console.log('[IntelliGit-Page] Received message from extension:', message);
    switch (message.command)
     {
      case 'githubToken':
        const token = message.token as string | null;
        setGithubToken(token);
        if (token) {
          // console.log('[IntelliGit-Page] GitHub token received. Fetching user repositories.');
          fetchUserRepositories(token);
          // fetchGithubUserInfo(token); // This call can remain as a fallback or for explicit refresh
        } else {
          // console.warn('[IntelliGit-Page] Received null GitHub token.');
          setUserRepositories([]);
          setIsUserAuthenticated(false);
          setGithubUserName(null);
          setGithubUserAvatar(null);
          if (message.error) { // Check for error on token message as well
            setErrorMessage(`Auth Error: ${message.error}`);
          }
        }
        break;
      case 'githubUserInfo': // New handler for githubUserInfo
        const userInfo = message.userInfo as { login: string; avatarUrl: string; name: string | null } | null;
        if (userInfo) {
          // console.log('[IntelliGit-Page] Received githubUserInfo from extension:', userInfo);
          setGithubUserName(userInfo.name || userInfo.login);
          setGithubUserAvatar(userInfo.avatarUrl);
          setIsUserAuthenticated(true);
          // Clear previous auth error if user info is successfully received
          setErrorMessage(null);
        } else {
          // console.log('[IntelliGit-Page] Received null githubUserInfo from extension.');
          // Potentially redundant if githubToken handler already cleared these, but ensures consistency
          setIsUserAuthenticated(false);
          setGithubUserName(null);
          setGithubUserAvatar(null);
          if (message.error) {
            setErrorMessage(`Auth Error: ${message.error}`);
          }
        }
        break;
      case 'repositoryInfo':
        // The extension now sends repositoryName (owner/repo) and currentBranch
        const { repositoryName, currentBranch, error: repoInfoErrorMsg } = message;
        
        setRepositoryNameFromExtension(repositoryName as string | null);
        setCurrentBranchFromExtension(currentBranch as string | null);
        setRepositoryInfoError(repoInfoErrorMsg as string | null);

        if (repoInfoErrorMsg) {
          // console.warn(`[IntelliGit-Page] Error in repositoryInfo from extension: ${repoInfoErrorMsg}`);
        }

        if (repositoryName && typeof repositoryName === 'string') {
          const parts = repositoryName.split('/');
          if (parts.length === 2) {
            setAutoDetectedOwner(parts[0]);
            setAutoDetectedRepo(parts[1]);
            // console.log(`[IntelliGit-Page] Auto-detected repository from extension: ${parts[0]}/${parts[1]}, Branch: ${currentBranch}`);
          } else if (repositoryName !== "N/A") {
            // This case might be for workspace folder name when not a git repo or no remote
            setAutoDetectedOwner(null); // No owner/repo structure
            setAutoDetectedRepo(repositoryName); // Store the whole name as repo (e.g. workspace folder name)
            // console.log(`[IntelliGit-Page] Auto-detected repository (workspace/fallback): ${repositoryName}, Branch: ${currentBranch}`);
          } else { // repositoryName is "N/A"
            setAutoDetectedOwner(null);
            setAutoDetectedRepo(null);
            // console.log(`[IntelliGit-Page] Repository name is N/A. Branch: ${currentBranch}`);
          }
        } else {
          setAutoDetectedOwner(null);
          setAutoDetectedRepo(null);
          // console.log(`[IntelliGit-Page] No valid repositoryName received from extension. Branch: ${currentBranch}`);
        }
        break;
      case 'gitLogData':
        const { commits: logData, error } = message.payload as { commits: Commit[], error?: string };
        if (repositoryConnected) {
            // console.log('[IntelliGit-Page] Ignoring local git log from WebviewMessenger as GitHub repo is connected.');
            return;
        }
        if (error) {
            console.error(`[IntelliGit-Page] Error receiving git log (local): ${error}`);
            setGitLogError(error);
            setGitLog([]);
        } else {
            // console.log(`[IntelliGit-Page] Git log data received (local): ${logData.length} commits`);
            setGitLog(logData);
            setGitLogError(null);
            setTotalCommitPages(1); 
            setCommitCurrentPage(1);
            setSelectedBranch(null); 
        }
        break;
      default:
        // console.log('[IntelliGit-Page] Received unknown message command from extension:', message.command);
    }
  }, [
    setGithubToken, 
    setAutoDetectedOwner, 
    setAutoDetectedRepo, 
    fetchUserRepositories, 
    repositoryConnected, 
    setGitLogError, 
    setGitLog, 
    setTotalCommitPages, 
    setCommitCurrentPage, 
    setSelectedBranch, 
    fetchGithubUserInfo,
    setGithubUserName,
    setGithubUserAvatar,
    setIsUserAuthenticated,
    setErrorMessage,
    setUserRepositories,
    setRepositoryNameFromExtension,
    setCurrentBranchFromExtension,
    setRepositoryInfoError
  ]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  // Effect for initial requests to the extension, runs once on mount
  useEffect(() => {
    // console.log('[IntelliGit-Page] Component mounted. Requesting GitHub token and initial repository info via vscodeApiInstance...');
    vscodeApiInstance.postMessage({ command: 'requestGitHubToken' });
    // This initial call will fetch workspace info if no GitHub repo is pre-selected/remembered,
    // or if the extension needs to determine context without specific GitHub repo details yet.
    vscodeApiInstance.postMessage({ command: 'requestRepositoryInfo' });
  }, []); // Empty dependency array means it runs once on mount

  // Effect to request repository info when a specific GitHub repo is connected or disconnected
  useEffect(() => {
    if (repositoryConnected && currentRepoOwner && currentRepoName) {
      // console.log(`[IntelliGit-Page] GitHub repository connected: ${currentRepoOwner}/${currentRepoName}. Requesting specific repository info from extension.`);
      vscodeApiInstance.postMessage({
        command: 'requestRepositoryInfo',
        githubRepoOwner: currentRepoOwner,
        githubRepoName: currentRepoName,
      });
    } else if (!repositoryConnected && (currentRepoOwner === null || currentRepoName === null)) {
      // This case handles when we are explicitly not connected to a specific GitHub repo,
      // or have disconnected. Request general/workspace info.
      // The initial on-mount request also covers the very first load.
      // console.log('[IntelliGit-Page] No specific GitHub repository connected or explicit disconnect. Requesting general/workspace repository info.');
      vscodeApiInstance.postMessage({ command: 'requestRepositoryInfo' });
    }
    // Note: The vscodeApiInstance is stable and defined outside, so not needed in dependency array.
  }, [currentRepoOwner, currentRepoName, repositoryConnected]);

  // --- Auto-reload last connected repo session on mount ---
  const handleSessionLoaded = useCallback((event: MessageEvent) => {
    const message = event.data;
    if (message && message.command === 'userSessionLoaded' && message.session && githubToken) {
      const { owner, name, branch } = message.session;
      loadRepositoryData(owner, name, githubToken, branch, 1);
    }
  }, [githubToken]);

  useEffect(() => {
    if (githubUserName) {
      vscodeApiInstance.postMessage({ command: 'loadUserSession', userId: githubUserName });
    }
  }, [githubUserName]);

  useEffect(() => {
    window.addEventListener('message', handleSessionLoaded);
    return () => window.removeEventListener('message', handleSessionLoaded);
  }, [handleSessionLoaded]);

  async function fetchBranches(owner: string, repo: string, token: string): Promise<Branch[]> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`,
    };
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error for branches: ${response.status} - ${errorData.message || 'Failed to fetch branches'}`);
    }
    const data = await response.json();
    return data.map((b: any) => ({
      name: b.name,
      commit: { sha: b.commit.sha, url: b.commit.url },
      protected: b.protected,
    }));
  }

  async function fetchContributors(owner: string, repo: string, token: string): Promise<Contributor[]> {
      const headers: HeadersInit = {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
      };
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`, { headers });
      if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 403 && errorData.message?.includes("too large")) {
              // console.warn(`[IntelliGit-Page] Could not fetch contributors for ${owner}/${repo}: list is too large.`);
              return [];
          }
          throw new Error(`GitHub API error for contributors: ${response.status} - ${errorData.message || 'Failed to fetch contributors'}`);
      }
      const data = await response.json();
      const initialContributors: Contributor[] = data.map((c: any) => ({
          id: c.id,
          login: c.login,
          avatar_url: c.avatar_url,
          html_url: c.html_url,
          apiUrl: c.url, // This is the user's API URL, e.g., https://api.github.com/users/snabialla
          contributions: c.contributions,
          // email will be fetched next
      }));

      const detailedContributors = await Promise.all(
          initialContributors.map(async (contrib) => {
              if (!contrib.apiUrl) return { ...contrib, name: contrib.login, email: undefined }; // Ensure email is undefined if no apiUrl
              try {
                  // Fetch detailed user info which might include the public email
                  const userResponse = await fetch(contrib.apiUrl, { headers });
                  if (!userResponse.ok) {
                      // console.warn(`Failed to fetch details for ${contrib.login}: ${userResponse.status}`);
                      // Return basic info with existing contributions, but no email
                      return { ...contrib, name: contrib.login, email: undefined };
                  }
                  const userData = await userResponse.json();
                  // userData.email might be null if not public or not set
                  return { 
                      ...contrib, 
                      name: userData.name || contrib.login, 
                      email: userData.email || undefined, // Store email if available, otherwise undefined
                      contributions: contrib.contributions // Ensure contributions are preserved
                  };
              } catch (err) {
                  console.error(`Error fetching details for ${contrib.login}:`, err);
                  // Fallback with existing contributions, no email
                  return { ...contrib, name: contrib.login, email: undefined };
              }
          })
      );
      // console.log('[IntelliGit-Page] Detailed contributors with emails (if public):', detailedContributors);
      return detailedContributors;
  }
  
  const parseLinkHeader = (linkHeader: string | null): Record<string, string> => {
      if (!linkHeader) {
        return {};
      }
      const links: Record<string, string> = {};
      linkHeader.split(',').forEach(part => {
        const section = part.split(';');
        if (section.length < 2) {
          return;
        }
        const url = section[0].replace(/<(.*)>/, '$1').trim();
        const name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
      });
      return links;
  };

  const fetchCommitsForPage = async (owner: string, repo: string, page: number, perPage: number, tokenToUse: string | null, branchName?: string): Promise<{ commits: Commit[]; totalPages: number; currentPage: number } | undefined> => {
      // console.log(`[IntelliGit-Page] Fetching commits for ${owner}/${repo}, branch: ${branchName || 'default'}, page: ${page}, per_page: ${perPage}`);
      // setGitLogError(null); // Error will be handled by caller via return value

      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (tokenToUse) {
        headers['Authorization'] = `token ${tokenToUse}`;
      } else {
        // console.warn("[IntelliGit-Page] No GitHub token provided for fetching commits. Public data only.");
      }

      let commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`;
      if (branchName) {
        commitsUrl += `&sha=${branchName}`;
      }

      try {
        const commitsResponse = await fetch(commitsUrl, { headers });
        if (!commitsResponse.ok) {
          const errorData = await commitsResponse.json();
          throw new Error(`GitHub API error for commits: ${commitsResponse.status} - ${errorData.message || 'Failed to fetch commits'}`);
        }
        
        const linkHeader = commitsResponse.headers.get('Link');
        const links = parseLinkHeader(linkHeader);
        
        let calculatedTotalPages = 1;
        if (page === 1) { // Only calculate total pages when fetching the first page
          if (links.last) {
            const lastUrl = new URL(links.last);
            const lastPage = lastUrl.searchParams.get('page');
            calculatedTotalPages = lastPage ? parseInt(lastPage, 10) : 1;
          } else {
            // If no 'last' link, it means there's only one page or it's the only page with content.
            // We need to check if the current page has items to determine if it's 1 or 0 (if empty).
            // For simplicity, if no 'last' link, assume current page is the only one.
            // This will be updated by setTotalCommitPages in loadRepositoryData based on actual commits.
             calculatedTotalPages = 1; 
          }
        } else {
          // If not the first page, we don't recalculate totalPages from link headers here.
          // It should have been set by the first page load.
          // We will pass the existing totalCommitPages state or a similar mechanism.
          // For now, let's rely on the caller (loadRepositoryData) to manage totalCommitPages state.
          // This function will just return the commits for the current page.
        }

        const commitsData = await commitsResponse.json();
        const formattedCommits: Commit[] = commitsData.map((commit: any) => ({
          hash: commit.sha,
          authorName: commit.commit.author?.name || 'N/A',
          authorEmail: commit.commit.author?.email || 'N/A',
          date: commit.commit.author?.date || 'N/A',
          subject: commit.commit.message.split('\\n')[0],
          body: commit.commit.message.split('\\n').slice(1).join('\\n').trim(),
          parents: commit.parents.map((p: any) => p.sha.substring(0, 7)).join(', '),
          refs: '' 
        }));
        
        // Return the data instead of setting state here
        return { commits: formattedCommits, totalPages: calculatedTotalPages, currentPage: page };

      } catch (error: any) {
        console.error(`[IntelliGit-Page] Error fetching commits from GitHub for ${owner}/${repo}:`, error);
        // setGitLogError(error.message || "Failed to fetch commits. Check console for details.");
        // setGitLog([]);
        return undefined; // Indicate failure
      }
  };

  const loadRepositoryData = useCallback(async (paramOwner: string | null, paramRepo: string | null, token: string, branch?: string, pageToLoad?: number) => {
    const owner = typeof paramOwner === 'string' ? paramOwner.trim() : null;
    const repo = typeof paramRepo === 'string' ? paramRepo.trim() : null;

    if (!owner || owner === "N/A" || !repo || repo === "N/A") {
      // console.warn(`[IntelliGit-Page] Invalid or N/A owner ('${owner}') or repo ('${repo}'). Aborting loadRepositoryData.`);
      setRepositoryConnected(false);
      setCurrentRepoOwner(null);
      setCurrentRepoName(null);
      setGitLog([]);
      setContributors([]);
      setBranches([]);
      setIsLoading(false);
      if ((paramOwner && String(paramOwner).trim() === "N/A") || (paramRepo && String(paramRepo).trim() === "N/A")) {
        setErrorMessage("Repository information is N/A. Cannot load data.");
      } else {
        setErrorMessage("Repository owner or name is invalid or missing. Cannot load data.");
      }
      return;
    }

    // console.log(`[IntelliGit-Page] Loading repository data for ${owner}/${repo}, branch: ${branch || 'default'}, page: ${pageToLoad || commitCurrentPage}`);
    setIsLoading(true);
    setErrorMessage(null);
    setGitLogError(null);

    try {
      const tokenToUse = token; 
      if (!tokenToUse) {
        throw new Error("GitHub token is not available.");
      }

      // Determine the branch to use for fetching commits
      const effectiveBranch = branch || selectedBranch || undefined;
      // Determine the page to load for commits
      const currentPageForCommits = pageToLoad || (branch ? 1 : commitCurrentPage);

      const [fetchedBranches, fetchedContributorsData, fetchedCommitsResult] = await Promise.all([
        fetchBranches(owner!, repo!, tokenToUse), // Added non-null assertion as owner/repo are validated before this point
        fetchContributors(owner!, repo!, tokenToUse), // Added non-null assertion
        fetchCommitsForPage(owner!, repo!, currentPageForCommits, commitsPerPage, tokenToUse, effectiveBranch), // Added non-null assertion
      ]);

      setBranches(fetchedBranches);
      let newSelectedBranch = selectedBranch;

      if (fetchedBranches.length > 0) {
        if (branch && fetchedBranches.some(b => b.name === branch)) { // If a specific branch was requested and exists
          newSelectedBranch = branch;
        } else if (!selectedBranch || !fetchedBranches.some(b => b.name === selectedBranch)) { // If no branch selected or current selection is invalid
          const mainBranch = fetchedBranches.find(b => b.name === 'main') || fetchedBranches.find(b => b.name === 'master');
          newSelectedBranch = mainBranch ? mainBranch.name : fetchedBranches[0].name;
        }
      } else {
        newSelectedBranch = null; // No branches found
      }
      setSelectedBranch(newSelectedBranch);
      
      if (fetchedCommitsResult) {
        setGitLog(fetchedCommitsResult.commits);
        if (fetchedCommitsResult.currentPage === 1) {
            setTotalCommitPages(fetchedCommitsResult.totalPages);
        }
        setCommitCurrentPage(fetchedCommitsResult.currentPage);
        setGitLogError(null);
      } else {
        setGitLogError(`Failed to fetch commits for ${owner}/${repo}.`);
        setGitLog([]);
        setTotalCommitPages(1);
        setCommitCurrentPage(1);
      }

      setContributors(fetchedContributorsData);
      setCurrentRepoOwner(owner);
      setCurrentRepoName(repo);
      setRepositoryConnected(true);
    } catch (error: any) {
      console.error(`[IntelliGit-Page] Error loading repository data for ${owner}/${repo}:`, error);
      setErrorMessage(error.message || "Failed to load repository data. Check console for details.");
      setGitLog([]);
      setContributors([]);
      setBranches([]);
      setTotalCommitPages(1);
      setCommitCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  }, [
    commitsPerPage, fetchBranches, fetchContributors, 
    setBranches, setSelectedBranch, setGitLog, setTotalCommitPages, setCommitCurrentPage, setContributors, 
    setCurrentRepoOwner, setCurrentRepoName, setRepositoryConnected, setIsLoading, setErrorMessage, setGitLogError,
    commitCurrentPage, selectedBranch 
  ]);

  // Handler for opening the settings dialog
  const handleOpenSettingsDialog = () => {
    setIsSettingsOpen(true);
    if (githubToken && !userRepositories.length && !isFetchingUserRepos) {
        fetchUserRepositories(githubToken);
    }
  };

  // Handler for saving settings (connecting to a new repo)
  const handleSaveSettings = (newOwner: string, newRepo: string) => {
    if (githubToken && newOwner && newRepo) {
      loadRepositoryData(newOwner, newRepo, githubToken, undefined, 1);
    }
    setIsSettingsOpen(false);
  };

  // Handler for commit click to open detail dialog
  const handleCommitClick = (commit: Commit) => {
    setSelectedCommit(commit);
    setIsCommitDetailOpen(true);
  };

  // Handler for contributor click to open detail dialog
  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsContributorDetailOpen(true);
  };

  // Handler for branch change
  const handleBranchChange = (branchName: string) => {
    if (currentRepoOwner && currentRepoName && githubToken) {
      setSelectedBranch(branchName);
      // Reload commits for the new branch, starting from page 1
      loadRepositoryData(currentRepoOwner, currentRepoName, githubToken, branchName, 1);
    }
  };

  // Handler for commit page change
  const handleCommitPageChange = (newPage: number) => {
    if (currentRepoOwner && currentRepoName && githubToken) {
      setCommitCurrentPage(newPage);
      loadRepositoryData(currentRepoOwner, currentRepoName, githubToken, selectedBranch || undefined, newPage);
    }
  };

  // Handler for adding a new member
  const handleAddMember = async (username: string, permission: PermissionLevel) => {
    if (!currentRepoOwner || !currentRepoName || !githubToken) {
      setAddMemberError("Repository information or GitHub token is missing.");
      return;
    }
    setIsAddingMember(true);
    setAddMemberError(null);
    try {
      // First, check if the user is already a collaborator (optional, GitHub API might handle this)
      // const isAlreadyCollaborator = await checkIfCollaborator(currentRepoOwner, currentRepoName, username, githubToken);
      // if (isAlreadyCollaborator) {
      //   setAddMemberError(`User ${username} is already a collaborator.`);
      //   setIsAddingMember(false);
      //   return;
      // }

      await addRepositoryCollaborator(currentRepoOwner, currentRepoName, username, permission, githubToken);
      // Potentially re-fetch contributors or update UI optimistically
      // For now, just close dialog and maybe show a success message (via toast or similar)
      setIsAddMemberDialogOpen(false);
      // Consider adding a success toast here
    } catch (error: any) {
      console.error("[IntelliGit-Page] Error adding member:", error);
      setAddMemberError(error.message || "Failed to add member.");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Props for AddMemberDialog
  const addMemberDialogProps: AddMemberDialogProps = {
    open: isAddMemberDialogOpen, // Changed from isOpen to open
    onOpenChange: setIsAddMemberDialogOpen,
    onAddMember: handleAddMember,
    isLoading: isAddingMember,
    error: addMemberError,
  };

  // Props for SettingsDialog
  const settingsDialogProps: SettingsDialogProps = {
    open: isSettingsOpen, // Changed from isOpen to open
    onOpenChange: setIsSettingsOpen,
    repoInput: repoInput, // Pass repoInput
    setRepoInput: setRepoInput, // Pass setRepoInput
    onConnect: () => { // Define onConnect
      if (repoInput) {
        const [owner, repo] = repoInput.split('/');
        if (owner && repo && githubToken) {
          loadRepositoryData(owner, repo, githubToken, undefined, 1);
          setIsSettingsOpen(false); // Close dialog on connect
        } else if (!githubToken) {
          setErrorMessage("GitHub token not available. Please authenticate via the extension.");
        } else {
          setErrorMessage("Invalid repository format. Please use 'owner/repo'.");
        }
      }
    },
    userRepositories: userRepositories,
    isFetchingUserRepos: isFetchingUserRepos,
    onRepoSelect: (selectedRepoFullName: string) => {
        setRepoInput(selectedRepoFullName); // Update repoInput when a repo is selected from the list
        // Optionally, connect immediately on select, or wait for "Connect" button
        // For now, just updates the input. User clicks "Connect".
    },
    error: errorMessage, 
    isLoading: isLoading || isFetchingUserRepos,
    githubToken: githubToken || '',
    onSaveToken: () => {}, // <-- Fix: always provide a function
    tokenStatus: '',
  };

  // Placeholder for LoginDialog state and handlers
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  
  // Placeholder for logout handler
  const handleLogout = () => {
    // console.log("[IntelliGit-Page] Logout clicked. Clearing token and user info.");
    vscodeApiInstance.postMessage({ command: 'clearGitHubToken' });
    setGithubToken(null);
    setIsUserAuthenticated(false);
    setGithubUserName(null);
    setGithubUserAvatar(null);
    setUserRepositories([]);
    // Optionally, disconnect repository as well or prompt user
    // setCurrentRepoOwner(null);
    // setCurrentRepoName(null);
    // setRepositoryConnected(false);
    // setGitLog([]);
    // setContributors([]);
    // setBranches([]);
    // setErrorMessage("Logged out. Connect to GitHub to continue.");
  };

  // Placeholder for retry fetch repos
  const handleRetryFetchRepos = () => {
    if (githubToken) {
      fetchUserRepositories(githubToken);
    }
  };

  // Placeholder for connect repository (used by CollabSidebar if it has a direct connect button)
  const handleConnectRepository = () => {
    setIsSettingsOpen(true); // Open settings to connect
  };

  // Placeholder for disconnect repository
  const handleDisconnectRepository = () => {
    // console.log("[IntelliGit-Page] Disconnect repository clicked.");
    setCurrentRepoOwner(null);
    setCurrentRepoName(null);
    setRepositoryConnected(false);
    setGitLog([]);
    setContributors([]); // Clear contributors
    setBranches([]);
    setSelectedBranch(null);
    setRepositoryNameFromExtension(null); // Clear extension-provided name
    setCurrentBranchFromExtension(null);  // Clear extension-provided branch
    setErrorMessage("Repository disconnected.");
    // Request general workspace info again
    vscodeApiInstance.postMessage({ command: 'requestRepositoryInfo' });
  };


  // --- Save user session to extension (and Firebase) on repo/branch change ---
useEffect(() => {
  if (githubUserName && currentRepoOwner && currentRepoName && repositoryConnected) {
    vscodeApiInstance.postMessage({
      command: 'saveUserSession',
      userId: githubUserName,
      session: {
        owner: currentRepoOwner,
        name: currentRepoName,
        branch: selectedBranch || undefined
      }
    });
  }
}, [githubUserName, currentRepoOwner, currentRepoName, selectedBranch, repositoryConnected]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <WebviewMessenger 
        vscodeApi={vscodeApiInstance} 
        onGitLogDataReceived={(commits, error) => {
          if (!repositoryConnected) { // Only use this if no GitHub repo is connected
            if (error) {
              setGitLogError(error);
              setGitLog([]);
            } else {
              setGitLog(commits);
              setGitLogError(null);
              setTotalCommitPages(1); // For local logs, assume one page
              setCommitCurrentPage(1);
            }
          }
        }}
        repositoryConnected={repositoryConnected}
      />
      <CollabSidebar
        contributors={contributors} // Changed from currentContributors
        onContributorClick={handleContributorClick}
        onAddMemberClick={() => setIsAddMemberDialogOpen(true)}
        branches={branches}
        selectedBranch={currentBranchFromExtension || selectedBranch} // Prefer extension's branch, fallback to page's selectedBranch
        onBranchChange={handleBranchChange}
        repositoryConnected={repositoryConnected}
        currentRepoName={currentRepoName}
        currentRepoOwner={currentRepoOwner}
        isUserAuthenticated={isUserAuthenticated}
        githubUserName={githubUserName}
        githubUserAvatar={githubUserAvatar}
        onLoginClick={() => setIsLoginDialogOpen(true)}
        onLogoutClick={handleLogout}
        isLoading={isLoading || isFetchingUserRepos} // Combined loading states
        errorMessage={errorMessage}
        onOpenSettings={handleOpenSettingsDialog} // Corrected prop name
        onRetryFetchRepos={handleRetryFetchRepos}
        onConnectRepository={handleConnectRepository}
        onDisconnectRepository={handleDisconnectRepository}
      />
      <MainPanel
        vscodeApi={vscodeApiInstance} 
        gitLog={gitLog} 
        gitLogError={gitLogError}
        onOpenSettingsDialog={handleOpenSettingsDialog} 
        commitCurrentPage={commitCurrentPage}
        totalCommitPages={totalCommitPages}
        onCommitPageChange={handleCommitPageChange}
        onCommitClick={handleCommitClick}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        contributors={contributors}
        repositoryName={repositoryNameFromExtension || (currentRepoOwner && currentRepoName ? `${currentRepoOwner}/${currentRepoName}` : "N/A")}
        currentBranchForNotification={currentBranchFromExtension || selectedBranch}
        repositoryConnected={repositoryConnected}
        // Chat props
        chatMessages={chatMessages}
        chatInput={chatInput}
        onChatInputChange={(e) => setChatInput(e.target.value)}
        onSendChatMessage={handleSendChatMessage}
        isSendingChatMessage={isSendingMessage}
        chatError={chatError}
        currentUserName={githubUserName}
        // Add these props for sync refresh
        loadRepositoryData={loadRepositoryData}
        currentRepoOwner={currentRepoOwner}
        currentRepoName={currentRepoName}
        githubToken={githubToken}
      />

      {/* Dialogs */}
      {selectedCommit && (
        <CommitDetailDialog 
          commit={selectedCommit} 
          open={isCommitDetailOpen} 
          onOpenChange={setIsCommitDetailOpen} 
        />
      )}
      {selectedContributor && (
        <ContributorDetailDialog 
          contributor={selectedContributor} 
          open={isContributorDetailOpen} 
          onOpenChange={setIsContributorDetailOpen} 
        />
      )}
      <AddMemberDialog {...addMemberDialogProps} />
      <SettingsDialog {...settingsDialogProps} />

      {/* Global Loading Indicator (optional) */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded-lg shadow-xl">
            Loading repository data...
          </div>
        </div>
      )}
      {/* Global Error Message (optional) */}
      {errorMessage && !isSettingsOpen && ( // Don't show global error if settings dialog is open (it shows its own errors)
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-xl z-50">
          Error: {errorMessage}
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)} className="ml-2">Dismiss</Button>
        </div>
      )}
    </div>
  );
}