"use client"; // Required for useState and useEffect

import React, { useState, useEffect, useCallback } from 'react';
import { CollabSidebar } from '@/components/collab-sidebar';
import { MainPanel } from '@/components/main-panel';
import WebviewMessenger, { Commit } from '@/components/WebviewMessenger'; // Import Commit interface
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
import { AddMemberDialog, AddMemberDialogProps } from '@/components/AddMemberDialog'; // Import AddMemberDialog and its props
import { SettingsDialog } from '@/components/SettingsDialog'; // Import the new SettingsDialog

interface RepositoryInfo {
  id: string | number;
  name: string;
  full_name: string; // format: "owner/repo"
  owner: {
    login: string;
  };
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
              <div id="subject" className="col-span-3">{commit.subject}</div>
            </div>
            {commit.body && (
              <div className="grid grid-cols-4 items-start gap-x-4 gap-y-1">
                <Label htmlFor="message" className="text-right font-semibold col-span-1">Message:</Label>
                <div className="col-span-3 bg-muted rounded-md flex items-start">
                  <div id="message" className="whitespace-pre-wrap font-sans text-sm p-2 w-full">
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
      console.log('[IntelliGit-Page] Posting message to parent (webview host):', message, 'Targeting parent origin: *');
      window.parent.postMessage(message, '*');
    } else {
      console.warn('[IntelliGit-Page] window.parent is not available or is self. Cannot post message to extension host.');
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
  const [repoInput, setRepoInput] = useState('');
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [autoDetectedOwner, setAutoDetectedOwner] = useState<string | null>(null);
  const [autoDetectedRepo, setAutoDetectedRepo] = useState<string | null>(null);
  const [gitLogError, setGitLogError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentRepoOwner, setCurrentRepoOwner] = useState<string | null>(null);
  const [currentRepoName, setCurrentRepoName] = useState<string | null>(null);
  const [repositoryConnected, setRepositoryConnected] = useState<boolean>(false);
  const [commitsPerPage] = useState<number>(30); // Restored
  const [commitCurrentPage, setCommitCurrentPage] = useState<number>(1); // Restored
  const [totalCommitPages, setTotalCommitPages] = useState<number>(1); // Restored
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false); // Restored
  const [isAddingMember, setIsAddingMember] = useState(false); // Restored
  const [addMemberError, setAddMemberError] = useState<string | null>(null); // Restored
  const [userRepositories, setUserRepositories] = useState<RepositoryInfo[]>([]);
  const [isFetchingUserRepos, setIsFetchingUserRepos] = useState<boolean>(false);

  // New state for GitHub user authentication
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false);
  const [githubUserName, setGithubUserName] = useState<string | null>(null);
  const [githubUserAvatar, setGithubUserAvatar] = useState<string | null>(null);

  type PermissionLevel = 'pull' | 'push' | 'admin' | 'maintain' | 'triage';

  // Function to fetch GitHub user info
  const fetchGithubUserInfo = useCallback(async (token: string) => {
    if (!token) return;
    console.log('[IntelliGit-Page] Fetching GitHub user info...');
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
      console.log('[IntelliGit-Page] Successfully fetched GitHub user info for:', userData.login);
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
    console.log('[IntelliGit-Page] Fetching user repositories...');
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
      console.log('[IntelliGit-Page] Successfully fetched user repositories:', data.length);
    } catch (error: any) {
      console.error('[IntelliGit-Page] Error fetching user repositories:', error);
      setErrorMessage(error.message || 'Failed to fetch repositories.');
      setUserRepositories([]); // Clear previous list on error
    } finally {
      setIsFetchingUserRepos(false);
    }
  }, [setErrorMessage, setIsFetchingUserRepos, setUserRepositories]);

  const handleMessage = useCallback((event: MessageEvent) => {
    const message = event.data;
    // Log origin to understand it better
    console.log(`[IntelliGit-Page] Message received. Origin: ${event.origin}, Data:`, message);

    if (!message || !message.command) {
      return;
    }
    console.log('[IntelliGit-Page] Received message from extension:', message);
    switch (message.command)
     {
      case 'githubToken':
        const token = message.token as string | null;
        setGithubToken(token);
        if (token) {
          console.log('[IntelliGit-Page] GitHub token received. Fetching user repositories.');
          fetchUserRepositories(token);
          fetchGithubUserInfo(token); 
        } else {
          console.warn('[IntelliGit-Page] Received null GitHub token.');
          setUserRepositories([]);
          setIsUserAuthenticated(false);
          setGithubUserName(null);
          setGithubUserAvatar(null);
        }
        break;
      case 'repositoryInfo':
        setAutoDetectedOwner(message.owner as string | null);
        setAutoDetectedRepo(message.repo as string | null);
        console.log(`[IntelliGit-Page] Auto-detected repository: ${message.owner}/${message.repo}`);
        break;
      case 'gitLogData':
        const { commits: logData, error } = message.payload as { commits: Commit[], error?: string };
        if (repositoryConnected) {
            console.log('[IntelliGit-Page] Ignoring local git log from WebviewMessenger as GitHub repo is connected.');
            return;
        }
        if (error) {
            console.error(`[IntelliGit-Page] Error receiving git log (local): ${error}`);
            setGitLogError(error);
            setGitLog([]);
        } else {
            console.log(`[IntelliGit-Page] Git log data received (local): ${logData.length} commits`);
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
  }, [setGithubToken, setAutoDetectedOwner, setAutoDetectedRepo, fetchUserRepositories, repositoryConnected, setGitLogError, setGitLog, setTotalCommitPages, setCommitCurrentPage, setSelectedBranch, fetchGithubUserInfo]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  // Effect for initial requests to the extension, runs once on mount
  useEffect(() => {
    console.log('[IntelliGit-Page] Component mounted. Requesting GitHub token and repository info via vscodeApiInstance...');
    vscodeApiInstance.postMessage({ command: 'requestGitHubToken' });
    vscodeApiInstance.postMessage({ command: 'requestRepositoryInfo' });
  }, []);

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
              console.warn(`[IntelliGit-Page] Could not fetch contributors for ${owner}/${repo}: list is too large.`);
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
          apiUrl: c.url,
          contributions: c.contributions,
      }));

      const detailedContributors = await Promise.all(
          initialContributors.map(async (contrib) => {
              if (!contrib.apiUrl) return { ...contrib, name: contrib.login };
              try {
                  const userResponse = await fetch(contrib.apiUrl, { headers });
                  if (!userResponse.ok) {
                      console.warn(`Failed to fetch details for ${contrib.login}: ${userResponse.status}`);
                      return { ...contrib, name: contrib.login }; // Fallback name
                  }
                  const userData = await userResponse.json();
                  return { ...contrib, name: userData.name || contrib.login, contributions: contrib.contributions };
              } catch (err) {
                  console.error(`Error fetching details for ${contrib.login}:`, err);
                  return { ...contrib, name: contrib.login }; // Fallback name
              }
          })
      );
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

  const fetchCommitsForPage = async (owner: string, repo: string, page: number, perPage: number, tokenToUse: string | null, branchName?: string) => {
      console.log(`[IntelliGit-Page] Fetching commits for ${owner}/${repo}, branch: ${branchName || 'default'}, page: ${page}, per_page: ${perPage}`);
      setGitLogError(null);
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      if (tokenToUse) {
        headers['Authorization'] = `token ${tokenToUse}`;
      } else {
        console.warn("[IntelliGit-Page] No GitHub token provided for fetching commits. Public data only.");
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
        
        if (page === 1) {
          if (links.last) {
            const lastUrl = new URL(links.last);
            const lastPage = lastUrl.searchParams.get('page');
            setTotalCommitPages(lastPage ? parseInt(lastPage, 10) : 1);
          } else {
            setTotalCommitPages(1);
          }
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
        
        setGitLog(formattedCommits);
        setCommitCurrentPage(page);
        setGitLogError(null);

      } catch (error: any) {
        console.error(`[IntelliGit-Page] Error fetching commits from GitHub for ${owner}/${repo}:`, error);
        setGitLogError(error.message || "Failed to fetch commits. Check console for details.");
        setGitLog([]);
      }
  };

  const loadRepositoryData = async (owner: string, repo: string, token: string, branch?: string, page?: number) => {
    console.log(`[IntelliGit-Page] Loading repository data for ${owner}/${repo}, branch: ${branch || 'default'}, page: ${page || 1}`);
    setIsLoading(true);
    setErrorMessage(null);
    setGitLogError(null);

    try {
      const branchesData = await fetchBranches(owner, repo, token);
      setBranches(branchesData);
      const currentBranch = branch || branchesData.find(b => b.name === 'main' || b.name === 'master')?.name || (branchesData.length > 0 ? branchesData[0].name : null);
      setSelectedBranch(currentBranch);

      if (!currentBranch) {
        console.warn(`[IntelliGit-Page] No branches found or default branch could not be determined for ${owner}/${repo}`);
        setGitLog([]);
        setTotalCommitPages(1);
        setCommitCurrentPage(1);
      }

      const targetPage = page || 1;
      if (currentBranch) {
        await fetchCommitsForPage(owner, repo, targetPage, commitsPerPage, token, currentBranch);
      }

      const contributorsData = await fetchContributors(owner, repo, token);
      setContributors(contributorsData);

      setCurrentRepoOwner(owner);
      setCurrentRepoName(repo);
      setRepositoryConnected(true);
      console.log(`[IntelliGit-Page] Successfully loaded data for ${owner}/${repo}`);

    } catch (error: any) {
      console.error(`[IntelliGit-Page] Error loading repository data for ${owner}/${repo}:`, error);
      setErrorMessage(`Failed to load repository data: ${error.message}`);
      setRepositoryConnected(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (githubToken && autoDetectedOwner && autoDetectedRepo) {
      if (!repositoryConnected || currentRepoOwner !== autoDetectedOwner || currentRepoName !== autoDetectedRepo) {
        console.log(`[IntelliGit-Page] Auto-loading data for ${autoDetectedOwner}/${autoDetectedRepo}.`);
        loadRepositoryData(autoDetectedOwner, autoDetectedRepo, githubToken);
      }
    }
  }, [githubToken, autoDetectedOwner, autoDetectedRepo, repositoryConnected, currentRepoOwner, currentRepoName, loadRepositoryData]);

  const handleOpenSettingsDialog = () => {
    if (currentRepoOwner && currentRepoName) {
      setRepoInput(`${currentRepoOwner}/${currentRepoName}`);
    } else if (autoDetectedOwner && autoDetectedRepo) {
      setRepoInput(`${autoDetectedOwner}/${autoDetectedRepo}`);
    } else if (userRepositories.length > 0 && !repoInput) {
      setRepoInput(userRepositories[0].full_name);
    }
    setErrorMessage(null);
    setIsSettingsOpen(true);
  };

  const handleConnectToRepo = async () => {
    console.log("[IntelliGit-Page] Attempting to connect to repo via dialog. Input:", repoInput);
    setErrorMessage(null);

    if (!githubToken) {
      setErrorMessage("GitHub token not available. Please ensure the extension is authenticated.");
      return;
    }

    if (!repoInput || repoInput.trim() === '') {
      setErrorMessage("Repository input cannot be empty.");
      return;
    }

    let owner = '';
    let repo = '';
    const trimmedInput = repoInput.trim();

    if (trimmedInput.includes('github.com/')) {
        try {
            const url = new URL(trimmedInput);
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 2) {
                owner = pathParts[0];
                repo = pathParts[1].replace('.git', '');
            }
        } catch (e) {
            console.error("[IntelliGit-Page] Error parsing GitHub URL:", e);
        }
    } else if (trimmedInput.includes('/')) {
        const parts = trimmedInput.split('/');
        if (parts.length === 2 && parts[0] && parts[1]) {
            owner = parts[0];
            repo = parts[1].replace('.git', ''); // Remove .git if present
        }
    }

    if (!owner || !repo) {
      setErrorMessage("Invalid repository format. Use 'owner/repo' or a full GitHub URL.");
      return;
    }

    console.log(`[IntelliGit-Page] Parsed owner: ${owner}, repo: ${repo} from dialog input.`);
    await loadRepositoryData(owner, repo, githubToken);
    
    if (!errorMessage) { 
        setIsSettingsOpen(false); 
    }
  };
  
  const handleAddMember = async (username: string, permission: PermissionLevel) => {
    if (!username) {
      setAddMemberError("Username cannot be empty.");
      return;
    }
    if (!currentRepoOwner || !currentRepoName) {
      setAddMemberError("Repository not connected.");
      return;
    }
    if (!githubToken) {
      setAddMemberError("GitHub token not available.");
      return;
    }
    setIsAddingMember(true);
    setAddMemberError(null);

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
      };
      const response = await fetch(`https://api.github.com/repos/${currentRepoOwner}/${currentRepoName}/collaborators/${username}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ permission }),
        }
      );

      if (response.status === 201) {
        console.log(`[IntelliGit-Page] Successfully invited ${username}.`);
        setIsAddMemberDialogOpen(false);
      } else if (response.status === 204) {
         console.log(`[IntelliGit-Page] ${username} is already a collaborator or invitation is pending.`);
         setAddMemberError(`${username} is already a collaborator or an invitation is pending.`);
      } else {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || 'Failed to add member'}`);
      }
    } catch (error: any) {
      console.error("[IntelliGit-Page] Error adding member:", error);
      setAddMemberError(error.message || "Failed to add member.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleCommitClick = (commit: Commit) => {
    setSelectedCommit(commit);
    setIsCommitDetailOpen(true);
  };

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsContributorDetailOpen(true);
  };

  const handleBranchChange = async (branchName: string) => {
    if (currentRepoOwner && currentRepoName && githubToken) {
      setSelectedBranch(branchName);
      setCommitCurrentPage(1); // Reset to first page on branch change
      await loadRepositoryData(currentRepoOwner, currentRepoName, githubToken, branchName, 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (currentRepoOwner && currentRepoName && githubToken && selectedBranch) {
      fetchCommitsForPage(currentRepoOwner, currentRepoName, newPage, commitsPerPage, githubToken, selectedBranch);
    }
  };
  
  const handleOpenAddMemberDialog = () => {
    setAddMemberError(null); 
    setIsAddMemberDialogOpen(true);
  };

  // Handlers for login/logout
  const handleGitHubLogin = () => {
    console.log('[IntelliGit-Page] Requesting GitHub login via extension (using vscodeApiInstance)...');
    vscodeApiInstance.postMessage({ command: 'requestGitHubLogin' });
  };

  const handleGitHubLogout = () => {
    console.log('[IntelliGit-Page] Requesting GitHub logout via extension (using vscodeApiInstance)...');
    vscodeApiInstance.postMessage({ command: 'requestGitHubLogout' });
    // Clear local auth state immediately
    setGithubToken(null);
    setIsUserAuthenticated(false);
    setGithubUserName(null);
    setGithubUserAvatar(null);
    setUserRepositories([]);
    // Optionally, clear repository data as well
    // setGitLog([]);
    // setContributors([]);
    // setBranches([]);
    // setCurrentRepoName(null);
    // setCurrentRepoOwner(null);
    // setRepositoryConnected(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <WebviewMessenger
        vscodeApi={vscodeApiInstance} // Pass the API object
        onGitLogDataReceived={(commits, error) => {
            // The if(handleMessage) check is removed as handleMessage should always be available.
            handleMessage({ data: { command: 'gitLogData', payload: { commits, error } } } as MessageEvent);
        }}
        repositoryConnected={repositoryConnected}
      />
      <CollabSidebar
        contributors={contributors}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        onContributorClick={handleContributorClick}
        onAddMemberClick={handleOpenAddMemberDialog}
        repositoryConnected={repositoryConnected}
        currentRepoName={currentRepoName}
        currentRepoOwner={currentRepoOwner}
        // Pass new props for auth
        isUserAuthenticated={isUserAuthenticated}
        githubUserName={githubUserName}
        githubUserAvatar={githubUserAvatar}
        onLoginClick={handleGitHubLogin}
        onLogoutClick={handleGitHubLogout}
      />
      <MainPanel
        gitLog={gitLog}
        gitLogError={gitLogError}
        onOpenSettingsDialog={handleOpenSettingsDialog}
        commitCurrentPage={commitCurrentPage}
        totalCommitPages={totalCommitPages}
        onCommitPageChange={handlePageChange}
        onCommitClick={handleCommitClick}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        contributors={contributors}
      />
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
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        repoInput={repoInput}
        setRepoInput={setRepoInput}
        onConnect={handleConnectToRepo}
        userRepositories={userRepositories}
        isFetchingUserRepos={isFetchingUserRepos}
        onRepoSelect={(selectedRepoFullName: string) => setRepoInput(selectedRepoFullName)}
        error={errorMessage}
        isLoading={isLoading || isFetchingUserRepos}
      />
      <AddMemberDialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        onAddMember={handleAddMember}
        isLoading={isAddingMember}
        error={addMemberError}
      />
    </div>
  );
}