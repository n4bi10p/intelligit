"use client"; // Required for useState and useEffect

import { useState, useCallback, useEffect } from 'react';
import { CollabSidebar } from '@/components/collab-sidebar';
import { MainPanel } from '@/components/main-panel';
// Import Commit and VsCodeMessage types, but not the WebviewMessenger component for instantiation
import { Commit, VsCodeMessage } from '@/components/WebviewMessenger'; 
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
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { useAuth } from '@/contexts/AuthContext';
import { LoginDialog } from '@/components/LoginDialog';
import { UserProfile } from "@/components/UserProfile"; // Added import

// SettingsDialog component
const SettingsDialog: React.FC<{
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


export default function Home() {
  const { user, loading: authLoading, error: authError } = useAuth();

  const [repoName, setRepoName] = useState<string>('');
  const [gitLog, setGitLog] = useState<Commit[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [repoInput, setRepoInput] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [isCommitDetailOpen, setIsCommitDetailOpen] = useState<boolean>(false);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [isContributorDetailOpen, setIsContributorDetailOpen] = useState<boolean>(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState<boolean>(false); 
  const [commitCurrentPage, setCommitCurrentPage] = useState<number>(1);
  const [totalCommitPages, setTotalCommitPages] = useState<number>(1);

  const sendMessageToExtension = useCallback((message: VsCodeMessage) => {
    console.log('[IntelliGit-UI] Sending message to parent (extension host):', message);
    window.parent.postMessage(message, '*'); // Consider a more specific target origin for production
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<VsCodeMessage>) => {
      const message = event.data;
      // Ensure the message is from a trusted source (vscode-webview)
      if (!event.origin.startsWith('vscode-webview://')) {
        // console.warn('[IntelliGit-UI] Ignoring message from unexpected origin:', event.origin, message);
        return;
      }
      console.log('[IntelliGit-UI] Message received in page.tsx:', message);

      switch (message.command) {
        case 'gitLogResponse':
          if (message.error) {
            console.error('Error fetching git log:', message.error);
            setGitLog([]); // Clear log on error or set an error state
          } else {
            // Assuming payload is { log: Commit[], currentPage: number, totalPages: number }
            // Adjust based on actual payload structure from the extension
            setGitLog(message.payload?.log || message.payload || []); // Fallback if payload is just Commit[]
            setCommitCurrentPage(message.payload?.currentPage || 1);
            setTotalCommitPages(message.payload?.totalPages || 1);
          }
          break;
        case 'contributorsResponse':
          if (message.error) {
            console.error('Error fetching contributors:', message.error);
            setContributors([]);
          } else {
            setContributors(message.payload || []);
          }
          break;
        case 'branchesResponse':
          if (message.error) {
            console.error('Error fetching branches:', message.error);
            setBranches([]);
          } else {
            setBranches(message.payload || []);
          }
          break;
        case 'repoNameResponse': // Example: If extension sends back the repo name
           if (message.error) {
            console.error('Error with repo name:', message.error);
          } else {
            setRepoName(message.payload || '');
          }
          break;
        case 'repoConnected': // Example: Confirmation that repo is connected
          if (message.payload?.repoName) {
            setRepoName(message.payload.repoName);
            // Fetch initial data now that repo is confirmed
            sendMessageToExtension({ command: 'getBranches', payload: { repoName: message.payload.repoName, token: tokenInput || undefined } });
            sendMessageToExtension({ command: 'getContributors', payload: { repoName: message.payload.repoName, token: tokenInput || undefined } });
            sendMessageToExtension({ command: 'getGitLog', payload: { repoName: message.payload.repoName, token: tokenInput || undefined, branch: selectedBranch || undefined, page: 1 } });
          }
          break;
        // Add more cases to handle other responses from the extension
        default:
          // console.log('[IntelliGit-UI] Unknown command received in page.tsx:', message.command);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial data if repoName is already known (e.g., from a previous session/state)
    // This part might need adjustment based on how repoName is persisted or initialized.
    // For now, assuming repoName is either empty or already set.
    // If repoName is set, initial data fetch will happen via 'repoConnected' or similar.
    // Or, if repoName is loaded from localStorage, fetch here:
    if (repoName) {
        // This initial fetch might be redundant if 'repoConnected' handles it.
        // Consider if this is needed or if connection flow dictates initial fetch.
        sendMessageToExtension({ command: 'getBranches', payload: { repoName, token: tokenInput || undefined } });
        sendMessageToExtension({ command: 'getContributors', payload: { repoName, token: tokenInput || undefined } });
        sendMessageToExtension({ command: 'getGitLog', payload: { repoName, token: tokenInput || undefined, branch: selectedBranch || undefined, page: commitCurrentPage } });
    }
    // Inform the extension that the webview is ready to receive messages
    sendMessageToExtension({ command: 'webviewReady' });


    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [repoName, tokenInput, selectedBranch, commitCurrentPage, sendMessageToExtension]); // Added commitCurrentPage and sendMessageToExtension to dependency array


  const handleConnect = useCallback(() => {
    if (repoInput) {
      // Optimistically set repoName, or wait for confirmation from extension via 'repoConnected'
      // setRepoName(repoInput);
      sendMessageToExtension({ command: 'connectToRepo', payload: { repoName: repoInput, token: tokenInput || undefined } });
      // The 'repoConnected' message handler should then trigger data fetching.
      setIsSettingsOpen(false);
    }
  }, [repoInput, tokenInput, sendMessageToExtension]); // Standard dependency array

  const handleBranchChange = useCallback((branchName: string) => {
    if (repoName) {
      setSelectedBranch(branchName);
      sendMessageToExtension({ command: 'getGitLog', payload: { repoName, token: tokenInput || undefined, branch: branchName, page: 1 } });
    }
  }, [repoName, tokenInput, sendMessageToExtension]);

  const handleCommitPageChange = useCallback((newPage: number) => {
    if (repoName) {
      sendMessageToExtension({ command: 'getGitLog', payload: { repoName, token: tokenInput || undefined, branch: selectedBranch || undefined, page: newPage } });
    }
  }, [repoName, tokenInput, selectedBranch, sendMessageToExtension]);

  const handleOpenCommitDetail = (commit: Commit) => {
    setSelectedCommit(commit);
    setIsCommitDetailOpen(true);
  };

  const handleOpenContributorDetail = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsContributorDetailOpen(true);
  };
  
  const handleAddMember = (memberDetails: { name: string; email: string; role: string }) => {
    console.log('Adding member:', memberDetails);
    sendMessageToExtension({ command: 'addRepositoryMember', payload: memberDetails });
    setIsAddMemberDialogOpen(false);
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <LoginDialog />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex flex-col w-full"> {/* Added wrapper div for UserProfile and the rest of the content */}
        <UserProfile />
        <div className="flex flex-1 overflow-hidden"> {/* Added flex-1 and overflow-hidden for proper layout */}
          <CollabSidebar
            repoName={repoName}
            onSettingsClick={() => setIsSettingsOpen(true)}
            contributors={contributors}
            onContributorClick={handleOpenContributorDetail} // Corrected prop name based on previous context
            onAddMemberClick={() => setIsAddMemberDialogOpen(true)} // Corrected prop name
          />
          <MainPanel
            gitLog={gitLog}
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={handleBranchChange}
            contributors={contributors} // Pass contributors if MainPanel needs it
            onOpenSettingsDialog={() => setIsSettingsOpen(true)} // Corrected prop name
            commitCurrentPage={commitCurrentPage}
            totalCommitPages={totalCommitPages}
            onCommitPageChange={handleCommitPageChange}
            onCommitClick={handleOpenCommitDetail} // Corrected prop name
          />
        </div>
      </div>
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        repoInput={repoInput}
        setRepoInput={setRepoInput}
        tokenInput={tokenInput}
        setTokenInput={setTokenInput}
        onConnect={handleConnect}
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
      <AddMemberDialog
        isOpen={isAddMemberDialogOpen} // Corrected prop name from 'open' to 'isOpen'
        onClose={() => setIsAddMemberDialogOpen(false)} // Corrected prop name
        onAddMember={handleAddMember} // Corrected prop name
      />
    </div>
  );
}
