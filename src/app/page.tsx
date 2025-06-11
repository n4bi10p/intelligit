"use client"; // Required for useState and useEffect

import { useState, useCallback, useEffect } from 'react'; // Import useEffect
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
  tokenInput: string;
  setTokenInput: (v: string) => void;
  onConnect: () => void;
}> = ({ open, onOpenChange, repoInput, setRepoInput, tokenInput, setTokenInput, onConnect }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Connect to GitHub Repository</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="repo-url" className="text-right">
            Repo URL
          </Label>
          <Input
            id="repo-url"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="e.g. https://github.com/owner/repo"
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="github-token" className="text-right">
            GitHub Token
          </Label>
          <Input
            id="github-token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            type="password"
            placeholder="(Optional) Personal Access Token"
            className="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="button" onClick={onConnect}>Connect</Button>
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
  const [gitLogError, setGitLogError] = useState<string | null>(null);
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
  const [tokenInput, setTokenInput] = useState('');

  // State for commit pagination
  const [commitCurrentPage, setCommitCurrentPage] = useState(1);
  const [commitsPerPage, setCommitsPerPage] = useState(30); // Default per_page for GitHub API
  const [totalCommitPages, setTotalCommitPages] = useState(1);
  const [currentRepoOwner, setCurrentRepoOwner] = useState<string | null>(null);
  const [currentRepoName, setCurrentRepoName] = useState<string | null>(null);

  // State for AddMemberDialog
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  // Define PermissionLevel type (can also be imported if shared)
  type PermissionLevel = 'pull' | 'push' | 'admin' | 'maintain' | 'triage';


  // Log changes to isSettingsOpen
  useEffect(() => {
    console.log('[CodeCollabAIPage] isSettingsOpen changed to:', isSettingsOpen);
  }, [isSettingsOpen]);

  const handleGitLogDataReceived = useCallback((logData: Commit[], error?: string) => {
    if (error) {
      console.error('[IntelliGit-Page] Error receiving git log:', error);
      setGitLogError(error);
      setGitLog([]); // Clear any existing log data
    } else {
      console.log('[IntelliGit-Page] Git log data received:', logData.length, 'commits');
      setGitLog(logData);
      setGitLogError(null); // Clear any previous error
    }
  }, []);

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

  const fetchCommitsForPage = async (owner: string, repo: string, page: number, perPage: number, token?: string, branchName?: string) => {
    console.log(`[IntelliGit-Page] Fetching commits for ${owner}/${repo}, branch: ${branchName || 'default'}, page: ${page}, per_page: ${perPage}`);
    setGitLogError(null);
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
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
      
      if (page === 1) { // Only update total pages when fetching the first page or when it changes
        if (links.last) {
          const lastUrl = new URL(links.last);
          const lastPage = lastUrl.searchParams.get('page');
          setTotalCommitPages(lastPage ? parseInt(lastPage, 10) : 1);
        } else {
          setTotalCommitPages(1); // Only one page
        }
      }

      const commitsData = await commitsResponse.json();
      const formattedCommits: Commit[] = commitsData.map((commit: any) => ({
        hash: commit.sha,
        authorName: commit.commit.author.name,
        authorEmail: commit.commit.author.email,
        date: commit.commit.author.date,
        subject: commit.commit.message.split('\n')[0],
        body: commit.commit.message.split('\n').slice(1).join('\n').trim(), // Trimmed the body
        parents: commit.parents.map((p: any) => p.sha.substring(0, 7)).join(', '),
        refs: '' 
      }));
      
      console.log('[IntelliGit-Page] Fetched commits:', formattedCommits.length, 'for page', page);
      setGitLog(formattedCommits);
      setCommitCurrentPage(page);
      setGitLogError(null);

    } catch (error: any) {
      console.error('[IntelliGit-Page] Error fetching commits from GitHub:', error);
      setGitLogError(error.message || "Failed to fetch commits. Check console for details.");
      setGitLog([]);
    }
  };


  const handleConnectToRepo = async () => {
    console.log("Attempting to connect to repo:", repoInput, "Token provided:", tokenInput ? "Yes" : "No");

    let owner = '';
    let repo = '';

    // Try to parse owner/repo from URL
    try {
      const url = new URL(repoInput);
      const pathParts = url.pathname.substring(1).split('/');
      if (pathParts.length >= 2) {
        owner = pathParts[0];
        repo = pathParts[1].replace('.git', '');
      }
    } catch (e) {
      // Not a valid URL, try to parse as owner/repo
      const parts = repoInput.split('/');
      if (parts.length === 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    if (!owner || !repo) {
      console.error("Invalid repository format. Please use owner/repo or a valid GitHub URL.");
      setGitLogError("Invalid repository format. Please use owner/repo or a valid GitHub URL.");
      return;
    }

    console.log(`Parsed owner: ${owner}, repo: ${repo}`);
    setGitLogError(null); 
    setIsSettingsOpen(false);
    setCurrentRepoOwner(owner);
    setCurrentRepoName(repo);
    setCommitCurrentPage(1);
    setSelectedBranch(null); // Reset selected branch

    // Fetch branches first
    let determinedBranchName: string | undefined = undefined;
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (tokenInput) {
      headers['Authorization'] = `token ${tokenInput}`;
    }
    try {
      const branchesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers });
      if (!branchesResponse.ok) {
        const errorData = await branchesResponse.json();
        throw new Error(`GitHub API error for branches: ${branchesResponse.status} - ${errorData.message || 'Failed to fetch branches'}`);
      }
      const branchesData = await branchesResponse.json();
      console.log('[IntelliGit-Page] Fetched branches:', branchesData.length);
      const fetchedBranches: Branch[] = branchesData.map((b: any) => ({
        name: b.name,
        commit: {
          sha: b.commit.sha,
          url: b.commit.url,
        },
        protected: b.protected,
      }));
      setBranches(fetchedBranches);
      if (fetchedBranches.length > 0) {
        const mainBranch = fetchedBranches.find(b => b.name === 'main');
        const masterBranch = fetchedBranches.find(b => b.name === 'master');
        determinedBranchName = mainBranch?.name || masterBranch?.name || fetchedBranches[0].name;
        setSelectedBranch(determinedBranchName);
        console.log('[IntelliGit-Page] Default branch set to:', determinedBranchName);
      }
    } catch (branchError: any) {
      console.error('[IntelliGit-Page] Error fetching branch data from GitHub:', branchError);
      setGitLogError(prevError => prevError ? `${prevError}\n${branchError.message || 'Failed to fetch branches.'}` : branchError.message || "Failed to fetch branches.");
      setBranches([]);
    }

    // Initial fetch for page 1 using the determined branch name
    await fetchCommitsForPage(owner, repo, 1, commitsPerPage, tokenInput, determinedBranchName);

    // Fetch contributors
    try {
      const contributorsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`, { headers });
      if (!contributorsResponse.ok) {
        const errorData = await contributorsResponse.json();
        if (contributorsResponse.status === 403 && errorData.message?.includes("too large")) {
          console.warn('[IntelliGit-Page] Could not fetch contributors: list is too large.');
          setGitLogError(prevError => prevError ? `${prevError}\\nCould not fetch contributors: list is too large.` : 'Could not fetch contributors: list is too large.');
          setContributors([]); 
        } else if (contributorsResponse.status === 403 && errorData.message?.includes("API rate limit exceeded")) {
          console.warn('[IntelliGit-Page] GitHub API rate limit exceeded while fetching contributors.');
          setGitLogError(prevError => prevError ? `${prevError}\\nGitHub API rate limit exceeded while fetching contributors.` : 'GitHub API rate limit exceeded while fetching contributors.');
          // Optionally, keep existing contributors or clear them
          // setContributors([]); 
        }
        else {
          throw new Error(`GitHub API error for contributors: ${contributorsResponse.status} - ${errorData.message || 'Failed to fetch contributors'}`);
        }
      } else {
        const contributorsData = await contributorsResponse.json();
        console.log('[IntelliGit-Page] Fetched initial contributors list:', contributorsData.length);
        
        const initialContributors: Contributor[] = contributorsData.map((c: any) => ({
          id: c.id,
          login: c.login,
          // Name might not be present here, will fetch later
          avatar_url: c.avatar_url,
          html_url: c.html_url,
          apiUrl: c.url, // Store the user's API URL
          contributions: c.contributions,
        }));
        setContributors(initialContributors);

        // Now fetch detailed info for each contributor to get their full name
        const detailedContributors = await Promise.all(
          initialContributors.map(async (contrib) => {
            try {
              const userResponse = await fetch(contrib.apiUrl, { headers });
              if (!userResponse.ok) {
                console.warn(`Failed to fetch details for ${contrib.login}: ${userResponse.status}`);
                return contrib; // Return original contributor data if fetch fails
              }
              const userData = await userResponse.json();
              return {
                ...contrib,
                name: userData.name || contrib.login, // Use fetched name, fallback to login
              };
            } catch (err) {
              console.error(`Error fetching details for ${contrib.login}:`, err);
              return contrib; // Return original contributor data on error
            }
          })
        );
        console.log('[IntelliGit-Page] Fetched detailed contributors list:', detailedContributors.length);
        setContributors(detailedContributors);
      }
    } catch (contributorError: any) {
      console.error('[IntelliGit-Page] Error fetching contributor data from GitHub:', contributorError);
      setGitLogError(prevError => prevError ? `${prevError}\n${contributorError.message || 'Failed to fetch contributors.'}` : contributorError.message || "Failed to fetch contributors.");
      setContributors([]);
    }
  };

  const handleAddMember = async (username: string, permission: PermissionLevel) => { // Added permission parameter
    if (!username) return;
    if (!currentRepoOwner || !currentRepoName) {
      setAddMemberError("Repository details are not set. Please connect to a repository first.");
      return;
    }
    console.log(`[IntelliGit-Page] Attempting to invite member: ${username} to ${currentRepoOwner}/${currentRepoName} with permission: ${permission}`);
    setIsAddingMember(true);
    setAddMemberError(null);

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (tokenInput) {
      headers['Authorization'] = `token ${tokenInput}`;
    } else {
      setAddMemberError("GitHub token is required to send invitations.");
      setIsAddingMember(false);
      return;
    }

    try {
      // Step 1: Invite the collaborator
      const inviteResponse = await fetch(`https://api.github.com/repos/${currentRepoOwner}/${currentRepoName}/collaborators/${username}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permission: permission }) // Use the selected permission
      });

      let userDataForList: any;
      let successMessage = `Invitation sent to "${username}".`;

      if (inviteResponse.status === 201) { // Invitation created
        console.log(`[IntelliGit-Page] Invitation successfully sent to ${username}.`);
        const invitationData = await inviteResponse.json();
        userDataForList = invitationData.invitee; // The invitee object from the response
        successMessage = `Invitation successfully sent to ${username}.`;
      } else if (inviteResponse.status === 204) { // User already a collaborator or has an outstanding invitation
        console.log(`[IntelliGit-Page] User ${username} is already a collaborator or has an outstanding invitation.`);
        // Fetch user data separately as 204 has no body
        const userDetailsResponse = await fetch(`https://api.github.com/users/${username}`, { headers });
        if (!userDetailsResponse.ok) {
          throw new Error(`User "${username}" is already a collaborator, but failed to fetch their details.`);
        }
        userDataForList = await userDetailsResponse.json();
        successMessage = `User "${username}" is already a collaborator or has an outstanding invitation.`;
      } else { // Handle other errors
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

      // Step 2: Add or update user in the local list
      if (userDataForList) {
        if (contributors.some(c => c.id === userDataForList.id)) {
          console.log(`[IntelliGit-Page] User ${username} already in the local list.`);
          // Optionally update existing entry if needed, though invitation status doesn't change existing fields much
        } else {
          const newContributor: Contributor = {
            id: userDataForList.id,
            login: userDataForList.login,
            name: userDataForList.name || userDataForList.login,
            avatar_url: userDataForList.avatar_url,
            html_url: userDataForList.html_url,
            apiUrl: userDataForList.url || `https://api.github.com/users/${userDataForList.login}`, // Ensure apiUrl is present
            contributions: 0, // Manually added/invited users might not have repo-specific contribution count here
          };
          setContributors(prevContributors => [newContributor, ...prevContributors].sort((a, b) => (b.name || b.login).localeCompare(a.name || a.login)));
          console.log(`[IntelliGit-Page] User ${username} added/updated in the local list.`);
        }
      }
      
      setAddMemberError(null); // Clear any previous error
      // Display success message (e.g., using a toast or by setting a temporary success state for the dialog)
      // For now, we'll rely on the dialog closing.
      console.log(successMessage);
      setIsAddMemberDialogOpen(false); 

    } catch (error: any) {
      console.error('[IntelliGit-Page] Error inviting member:', error);
      setAddMemberError(error.message || "Failed to invite member.");
    } finally {
      setIsAddingMember(false);
    }
  };


  const handleBranchChange = async (branchName: string) => {
    if (currentRepoOwner && currentRepoName) {
      console.log(`[IntelliGit-Page] Branch changed to: ${branchName}`);
      setSelectedBranch(branchName);
      setCommitCurrentPage(1); // Reset to first page for the new branch
      // Fetch commits for the new branch
      await fetchCommitsForPage(currentRepoOwner, currentRepoName, 1, commitsPerPage, tokenInput, branchName);
    } else {
      console.error('[IntelliGit-Page] Cannot change branch, repository details missing.');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (currentRepoOwner && currentRepoName && newPage > 0 && newPage <= totalCommitPages) { // selectedBranch is implicitly used by fetchCommitsForPage if set
      fetchCommitsForPage(currentRepoOwner, currentRepoName, newPage, commitsPerPage, tokenInput, selectedBranch || undefined);
    }
  };

  const handleOpenSettings = () => {
    console.log('[CodeCollabAIPage] handleOpenSettings called, setting isSettingsOpen to true');
    setIsSettingsOpen(true);
  };

  const handleOpenAddMemberDialog = () => {
    setAddMemberError(null); // Clear previous errors
    setIsAddMemberDialogOpen(true);
    console.log("[CodeCollabAIPage] Opening Add Member dialog.");
  };

  const handleCommitClick = (commit: Commit) => {
    setSelectedCommit(commit);
    setIsCommitDetailOpen(true);
    console.log("[CodeCollabAIPage] Commit clicked:", commit.hash);
  };

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsContributorDetailOpen(true);
    console.log("[CodeCollabAIPage] Contributor clicked:", contributor.login);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <main className="w-full max-w-7xl h-[calc(100vh-2rem)] flex rounded-lg shadow-2xl overflow-hidden border border-border">
        <CollabSidebar 
          contributors={contributors} 
          onContributorClick={handleContributorClick}
          onAddMemberClick={handleOpenAddMemberDialog} // Pass handler to open dialog
        />
        <MainPanel 
          gitLog={gitLog} 
          onOpenSettingsDialog={handleOpenSettings}
          commitCurrentPage={commitCurrentPage}
          totalCommitPages={totalCommitPages}
          onCommitPageChange={handlePageChange}
          onCommitClick={handleCommitClick}
          branches={branches} // Pass branches
          selectedBranch={selectedBranch} // Pass selectedBranch
          onBranchChange={handleBranchChange} // Pass handler
        /> 
      </main>
      {/* Pass the handler to WebviewMessenger */}
      <WebviewMessenger onGitLogDataReceived={handleGitLogDataReceived} />
      {gitLogError && (
        <div style={{ color: 'red', marginTop: '10px', padding: '10px', border: '1px solid red', backgroundColor: '#ffe0e0' }}>
          <strong>Error fetching Git log:</strong> {gitLogError}
        </div>
      )}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        repoInput={repoInput}
        setRepoInput={setRepoInput}
        tokenInput={tokenInput}
        setTokenInput={setTokenInput}
        onConnect={handleConnectToRepo}
      />
      {/* Commit Detail Dialog */}
      {selectedCommit && (
        <CommitDetailDialog 
          commit={selectedCommit}
          open={isCommitDetailOpen}
          onOpenChange={setIsCommitDetailOpen}
        />
      )}
      {/* Contributor Detail Dialog */}
      {selectedContributor && (
        <ContributorDetailDialog
          contributor={selectedContributor}
          open={isContributorDetailOpen}
          onOpenChange={setIsContributorDetailOpen}
        />
      )}
      {/* Add Member Dialog */}
      {isAddMemberDialogOpen && (
        <AddMemberDialog
          open={isAddMemberDialogOpen}
          onOpenChange={setIsAddMemberDialogOpen}
          onAddMember={handleAddMember} // This will now pass username and permission
          isLoading={isAddingMember}
          error={addMemberError}
        />
      )}
    </div>
  );
}
