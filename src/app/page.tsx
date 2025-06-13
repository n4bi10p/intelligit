"use client"; // Required for useState and useEffect

import React, { useState, useEffect, useCallback } from 'react'; // Ensure useCallback is imported
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
  DialogDescription // Added DialogDescription import
} from '@/components/ui/dialog';
import { Label } from "@/components/ui/label"; // Added Label import
import { Input } from "@/components/ui/input"; // Added Input import
import { Button } from "@/components/ui/button"; // Added Button import
import { Contributor, Branch } from '@/types'; // Import Branch type
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import { AddMemberDialog } from '@/components/AddMemberDialog'; // Import AddMemberDialog

// SettingsDialog component
const SettingsDialog: React.FC<{ // Ensure props match usage
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoInput: string;
  setRepoInput: (v: string) => void;
  onConnect: () => void;
}> = ({ open, onOpenChange, repoInput, setRepoInput, onConnect }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Connect to Repository</DialogTitle>
        <DialogDescription>
          Enter the repository URL or owner/repo (e.g., "owner/repo" or "https://github.com/owner/repo").
          GitHub authentication is handled automatically by the extension.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="repoUrl" className="text-right">
            Repo
          </Label>
          <Input
            id="repoUrl"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            className="col-span-3"
            placeholder="owner/repo or GitHub URL"
          />
        </div>
        {/* Token input field removed */}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={onConnect}>Connect</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

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
        <ScrollArea className="max-h-[60vh] p-3"> {/* Changed p-1 to p-3 for more space around content */}
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
        <div className="space-y-3 py-4"> {/* Changed from grid to space-y for vertical spacing of items */} 
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


export default function CodeCollabAIPage() {
  const [gitLog, setGitLog] = useState<Commit[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); // State for branches
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null); // State for selected branch
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null); // For commit detail dialog
  const [isCommitDetailOpen, setIsCommitDetailOpen] = useState(false); // For commit detail dialog

  // State for ContributorDetailDialog
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [isContributorDetailOpen, setIsContributorDetailOpen] = useState(false);

  // State for SettingsDialog
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  // const [tokenInput, setTokenInput] = useState(''); // REMOVED

  // State for GitHub token and auto-detected repository
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [autoDetectedOwner, setAutoDetectedOwner] = useState<string | null>(null);
  const [autoDetectedRepo, setAutoDetectedRepo] = useState<string | null>(null);
  const [gitLogError, setGitLogError] = useState<string | null>(null);

  // Additional states that were missing or became undefined
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentRepoOwner, setCurrentRepoOwner] = useState<string | null>(null);
  const [currentRepoName, setCurrentRepoName] = useState<string | null>(null);
  const [repositoryConnected, setRepositoryConnected] = useState<boolean>(false);
  const [commitsPerPage] = useState<number>(30);
  const [commitCurrentPage, setCommitCurrentPage] = useState<number>(1);
  const [totalCommitPages, setTotalCommitPages] = useState<number>(1);

  // States for AddMemberDialog
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Messenger for VS Code extension communication
  let vscodeApi: any = null;
  if (typeof window !== 'undefined' && (window as any).vscode) {
    vscodeApi = (window as any).vscode;
  }

  // Define PermissionLevel, if it's a specific set of strings
  type PermissionLevel = 'pull' | 'push' | 'admin' | 'maintain' | 'triage';

  const handleMessage = useCallback((event: MessageEvent) => {
    const message = event.data; // The event data
    if (!message || !message.command) {
      // Not a message we're interested in, or malformed
      return;
    }
    console.log('[IntelliGit-Page] Received message from extension:', message);
    switch (message.command) {
      case 'githubToken':
        if (message.token && typeof message.token === 'string') {
          console.log(`[IntelliGit-Page] Received githubToken from extension: ${message.token ? 'Token_Exists' : 'Token_Missing'}`);
          setGithubToken(message.token);
        } else {
          console.warn('[IntelliGit-Page] Received githubToken message without valid token property:', message);
        }
        break;
      case 'repositoryInfo':
        if (message.owner && typeof message.owner === 'string' && message.repo && typeof message.repo === 'string') {
          console.log(`[IntelliGit-Page] Received repositoryInfo from extension: owner=${message.owner}, repo=${message.repo}`);
          setAutoDetectedOwner(message.owner);
          setAutoDetectedRepo(message.repo);
        } else {
          console.warn('[IntelliGit-Page] Received repositoryInfo message without valid owner/repo properties:', message);
        }
        break;
      default:
        // console.log('[IntelliGit-Page] Received unhandled command:', message.command);
        break;
    }
  }, [setGithubToken, setAutoDetectedOwner, setAutoDetectedRepo]);

  // Helper function to fetch branches
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

  // Helper function to fetch contributors
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

  // Ensure this is the ONLY definition of loadRepositoryData
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

  // ... (fetchCommitsForPage and parseLinkHeader should be defined here if not already)
  // Ensure fetchCommitsForPage uses tokenToUse: string | null
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
        
        if (page === 1) { // Only update total pages if it's the first page fetch for this set
          if (links.last) {
            const lastUrl = new URL(links.last);
            const lastPage = lastUrl.searchParams.get('page');
            setTotalCommitPages(lastPage ? parseInt(lastPage, 10) : 1);
          } else {
            setTotalCommitPages(1); // If no 'last' link, assume it's a single page
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
        
        console.log(`[IntelliGit-Page] Fetched commits from GitHub API: ${formattedCommits.length} for page ${page}`);
        setGitLog(formattedCommits);
        setCommitCurrentPage(page);
        setGitLogError(null);

      } catch (error: any) {
        console.error(`[IntelliGit-Page] Error fetching commits from GitHub for ${owner}/${repo}:`, error);
        setGitLogError(error.message || "Failed to fetch commits. Check console for details.");
        setGitLog([]);
      }
    };

  // Request token and repo info on mount
  useEffect(() => {
    if (vscodeApi) {
      console.log('[IntelliGit-Page] vscodeApi available. Requesting GitHub token from extension...');
      vscodeApi.postMessage({ command: 'requestGitHubToken' });
      console.log('[IntelliGit-Page] Requesting repository info from extension...');
      vscodeApi.postMessage({ command: 'requestRepositoryInfo' });
    } else {
      console.warn('[IntelliGit-Page] vscodeApi is null. Cannot request GitHub token or repository info from extension at this time.');
    }
  }, [vscodeApi]);

  // Effect to automatically load repository data
  useEffect(() => {
    if (githubToken && autoDetectedOwner && autoDetectedRepo) {
      if (!repositoryConnected || currentRepoOwner !== autoDetectedOwner || currentRepoName !== autoDetectedRepo) {
        console.log(`[IntelliGit-Page] Auto-loading data for ${autoDetectedOwner}/${autoDetectedRepo}.`);
        loadRepositoryData(autoDetectedOwner, autoDetectedRepo, githubToken);
      }
    }
  }, [githubToken, autoDetectedOwner, autoDetectedRepo, repositoryConnected, currentRepoOwner, currentRepoName, loadRepositoryData]); // Added loadRepositoryData to dependencies

  const handleConnectToRepo = async () => {
    console.log("Attempting to connect to repo via dialog:", repoInput);

    if (!githubToken) {
      setGitLogError("GitHub token not available. Please ensure the extension is authenticated and VS Code is connected to GitHub.");
      setIsSettingsOpen(true); // Keep settings open to show the error or guide user
      return;
    }

    let owner = '';
    let repo = '';

    try {
      // Robust parsing for "owner/repo" or full GitHub URLs
      const trimmedInput = repoInput.trim();
      if (trimmedInput.includes("github.com")) {
        const url = new URL(trimmedInput);
        const pathParts = url.pathname.substring(1).split('/');
        if (pathParts.length >= 2) {
          owner = pathParts[0];
          repo = pathParts[1].replace('.git', '');
        }
      } else {
        const parts = trimmedInput.split('/');
        if (parts.length === 2) {
          owner = parts[0];
          repo = parts[1];
        }
      }
    } catch (e) {
      console.error("Error parsing repository input:", e);
      // Fallback to simple split if URL parsing fails (e.g. not a full URL)
      const parts = repoInput.trim().split('/');
      if (parts.length === 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    if (!owner || !repo) {
      console.error("Invalid repository format from input. Please use owner/repo or a valid GitHub URL.");
      setGitLogError("Invalid repository format. Please use 'owner/repo' or a full GitHub URL.");
      return;
    }

    console.log(`Parsed owner: ${owner}, repo: ${repo} from dialog input.`);
    // Call the main loading function with details from dialog
    await loadRepositoryData(owner, repo, githubToken);
    setIsSettingsOpen(false); // Close dialog on successful connection attempt
  };


  const handleAddMember = async (username: string, permission: PermissionLevel) => {
    if (!username) return;
    if (!currentRepoOwner || !currentRepoName) {
      setAddMemberError("Repository details are not set. Please connect to a repository first.");
      return;
    }
    if (!githubToken) {
      setAddMemberError("GitHub token is not available. Cannot add member.");
      return;
    }
    console.log(`[IntelliGit-Page] Attempting to invite member: ${username} to ${currentRepoOwner}/${currentRepoName} with permission: ${permission}`);
    setIsAddingMember(true);
    setAddMemberError(null);

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${githubToken}`, // Use githubToken from state
    };

    try {
      const inviteResponse = await fetch(`https://api.github.com/repos/${currentRepoOwner}/${currentRepoName}/collaborators/${username}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permission: permission })
      });

      let userDataForList: any;
      let successMessage = `Invitation sent to "${username}".`;

      if (inviteResponse.status === 201) {
        console.log(`[IntelliGit-Page] Invitation successfully sent to ${username}.`);
        const invitationData = await inviteResponse.json();
        userDataForList = invitationData.invitee;
        successMessage = `Invitation successfully sent to ${username}.`;
      } else if (inviteResponse.status === 204) {
        console.log(`[IntelliGit-Page] User ${username} is already a collaborator or has an outstanding invitation.`);
        const userDetailsResponse = await fetch(`https://api.github.com/users/${username}`, { headers }); // headers include token
        if (!userDetailsResponse.ok) {
          throw new Error(`User "${username}" is already a collaborator, but failed to fetch their details.`);
        }
        userDataForList = await userDetailsResponse.json();
        successMessage = `User "${username}" is already a collaborator or has an outstanding invitation.`;
      } else {
        const errorData = await inviteResponse.json();
        if (inviteResponse.status === 403) {
          throw new Error(`Failed to invite "${username}": Insufficient permissions. Token must have admin rights. Or, other restriction (e.g. inviting self, org policy). Details: ${errorData.message}`);
        } else if (inviteResponse.status === 404) {
          throw new Error(`Failed to invite "${username}": Repository or user not found. Details: ${errorData.message}`);
        } else if (inviteResponse.status === 422) {
          throw new Error(`Failed to invite "${username}": Validation error (e.g., user cannot be invited). Details: ${errorData.message}`);
        }
        throw new Error(`GitHub API error: ${inviteResponse.status} - ${errorData.message || 'Failed to send invitation'}`);
      }

      if (userDataForList) {
        if (!contributors.some(c => c.id === userDataForList.id)) {
          const newContributor: Contributor = {
            id: userDataForList.id,
            login: userDataForList.login,
            name: userDataForList.name || userDataForList.login,
            avatar_url: userDataForList.avatar_url,
            html_url: userDataForList.html_url,
            apiUrl: userDataForList.url || `https://api.github.com/users/${userDataForList.login}`,
            contributions: 0, // New invitees won't have contribution count from this repo yet
          };
          setContributors(prevContributors => [newContributor, ...prevContributors].sort((a, b) => (b.name || b.login).localeCompare(a.name || a.login)));
        }
      }
      console.log(successMessage);
      setIsAddMemberDialogOpen(false);

    } catch (error: any) {
      console.error('[IntelliGit-Page] Error inviting member:', error);
      setAddMemberError(error.message || "Failed to invite member.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleGitLogDataReceived = useCallback((logData: Commit[], error?: string) => {
    if (repositoryConnected) { // If connected to GitHub, prioritize that data
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
  }, [repositoryConnected]); 

  const handleCommitClick = (commit: Commit) => {
    setSelectedCommit(commit);
    setIsCommitDetailOpen(true);
  };

  const handleCommitPageChange = (newPage: number) => {
    if (currentRepoOwner && currentRepoName) {
      fetchCommitsForPage(currentRepoOwner, currentRepoName, newPage, commitsPerPage, githubToken, selectedBranch || undefined);
    }
  };

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsContributorDetailOpen(true);
  };
  
  const handleBranchChange = async (branchName: string) => {
    if (currentRepoOwner && currentRepoName && githubToken) {
      console.log(`[IntelliGit-Page] Branch changed to: ${branchName}`);
      setSelectedBranch(branchName);
      setCommitCurrentPage(1);
      await loadRepositoryData(currentRepoOwner, currentRepoName, githubToken, branchName, 1);
    } else if (currentRepoOwner && currentRepoName) {
      console.warn(`[IntelliGit-Page] Branch changed to ${branchName}, but no GitHub token. Local git log might be shown if available.`);
    } else {
      console.error('[IntelliGit-Page] Cannot change branch, repository details missing.');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (currentRepoOwner && currentRepoName && newPage > 0 && newPage <= totalCommitPages) {
      if (githubToken) {
        fetchCommitsForPage(currentRepoOwner, currentRepoName, newPage, commitsPerPage, githubToken, selectedBranch || undefined);
      } else {
        console.warn('[IntelliGit-Page] Page change requested, but no GitHub token. Local pagination not fully implemented here.');
      }
    }
  };

  const handleOpenSettings = () => {
    console.log('[CodeCollabAIPage] handleOpenSettings called, setting isSettingsOpen to true');
    setRepoInput(`${currentRepoOwner || autoDetectedOwner || ''}/${currentRepoName || autoDetectedRepo || ''}`);
    setIsSettingsOpen(true);
  };

  const handleOpenAddMemberDialog = () => {
    setAddMemberError(null); 
    setIsAddMemberDialogOpen(true);
    console.log("[CodeCollabAIPage] Opening Add Member dialog.");
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <WebviewMessenger onGitLogDataReceived={handleGitLogDataReceived} />
      <CollabSidebar
        contributors={contributors}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        onContributorClick={handleContributorClick}
        onAddMemberClick={handleOpenAddMemberDialog} // Corrected prop name
        repositoryConnected={repositoryConnected}
        currentRepoName={currentRepoName}
        currentRepoOwner={currentRepoOwner}
      />
      <MainPanel
        gitLog={gitLog}
        gitLogError={gitLogError}
        onOpenSettingsDialog={handleOpenSettings} // Corrected prop name
        commitCurrentPage={commitCurrentPage}
        totalCommitPages={totalCommitPages}
        onCommitPageChange={handlePageChange} // Corrected prop name
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
      />
      <AddMemberDialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen} // This handles closing
        onAddMember={handleAddMember}
        isLoading={isAddingMember}
        error={addMemberError} // Corrected prop name
      />
    </div>
  );
}