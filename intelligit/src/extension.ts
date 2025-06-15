// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as https from 'https'; // Added for making HTTPS requests to GitHub API
import * as nodemailer from 'nodemailer'; // Added for sending emails
import * as fs from 'fs'; // Added for reading the email template file - Consider replacing with vscode.workspace.fs for consistency
// import { promises as fsPromises } from 'fs'; // No longer needed for tasks
import * as admin from 'firebase-admin'; // Added for Firebase
import * as path from 'path'; // Added for path manipulation
import * as dotenv from 'dotenv'; // Added for environment variables

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log loaded environment variables for debugging
console.log('[IntelliGit] Attempting to load .env file from:', path.resolve(__dirname, '../.env'));
console.log('[IntelliGit] EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('[IntelliGit] EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('[IntelliGit] EMAIL_USER:', process.env.EMAIL_USER);
// For security, avoid logging the full password. Log if it's set or not.
console.log('[IntelliGit] EMAIL_PASS is set:', !!process.env.EMAIL_PASS);
console.log('[IntelliGit] FIREBASE_SERVICE_ACCOUNT_KEY_PATH:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
console.log('[IntelliGit] FIREBASE_DATABASE_URL:', process.env.FIREBASE_DATABASE_URL);

// Initialize Firebase Admin SDK
// IMPORTANT: You need to set up a Firebase project and provide service account credentials.
// The recommended way is to set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// to the absolute path of your service account JSON key file.
try {
    if (admin.apps.length === 0) { // Check if already initialized
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
        const databaseURL = process.env.FIREBASE_DATABASE_URL;

        if (serviceAccountPath && databaseURL) {
            const absoluteServiceAccountPath = path.resolve(__dirname, '..', serviceAccountPath);
            console.log(`[IntelliGit] Attempting to load Firebase service account key from resolved path: ${absoluteServiceAccountPath}`);
            if (fs.existsSync(absoluteServiceAccountPath)) {
                admin.initializeApp({
                    credential: admin.credential.cert(absoluteServiceAccountPath),
                    databaseURL: databaseURL
                });
                console.log('[IntelliGit] Firebase Admin SDK initializeApp call completed.'); // More specific log
                console.log(`[IntelliGit] admin.apps.length immediately after initializeApp: ${admin.apps.length}`); // CRITICAL LOG
                if (admin.apps.length > 0) {
                    console.log('[IntelliGit] Firebase Admin SDK successfully initialized an app.');
                } else {
                    console.warn('[IntelliGit] Firebase Admin SDK initializeApp was called, but admin.apps.length is 0. This indicates a silent initialization failure. Check key file validity and Firebase project settings.');
                }
            } else {
                console.error(`[IntelliGit] Firebase service account key file not found at path specified in .env (resolved to: ${absoluteServiceAccountPath}). Firebase features will be disabled.`);
                vscode.window.showErrorMessage(`IntelliGit: Firebase service account key file not found at ${absoluteServiceAccountPath}. Firebase features disabled.`);
            }
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Fallback to GOOGLE_APPLICATION_CREDENTIALS if .env variables are not set
            // Ensure databaseURL is available if using this method
            const databaseURLFallback = process.env.FIREBASE_DATABASE_URL;
            if (databaseURLFallback) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    databaseURL: databaseURLFallback 
                });
                console.log('[IntelliGit] Firebase Admin SDK initialized with GOOGLE_APPLICATION_CREDENTIALS.');
            } else {
                console.error('[IntelliGit] Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS but FIREBASE_DATABASE_URL is missing. Firebase features might be limited.');
                vscode.window.showErrorMessage('IntelliGit: Firebase initialized with default credentials but Database URL is missing.');
            }
        } else {
            console.error('[IntelliGit] Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH and FIREBASE_DATABASE_URL in .env or GOOGLE_APPLICATION_CREDENTIALS. Firebase features will be disabled.');
            vscode.window.showWarningMessage('IntelliGit: Firebase credentials not configured. Some features may be disabled.');
        }
    }
} catch (error: any) {
    console.error('[IntelliGit] Firebase Admin SDK initialization error. Firestore features will be disabled:', error.message);
    console.error('[IntelliGit] Full Firebase initialization error object:', error); // Log the full error object
    // Optionally, notify the user via vscode.window.showErrorMessage
    vscode.window.showErrorMessage(`IntelliGit: Firebase Admin SDK failed to initialize: ${error.message}. Task syncing will not work.`);
}

const db = admin.apps.length > 0 ? admin.firestore() : null; // Firestore database instance, null if init failed
console.log(`[IntelliGit] db instance created. admin.apps.length was: ${admin.apps.length}. Is db null? ${db === null}`); // Added log
if (!db) {
    console.warn("[IntelliGit] Firestore database instance (db) is null. Firebase features requiring Firestore will not work.");
}

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: parseInt(process.env.EMAIL_PORT || '587'), 
    secure: (process.env.EMAIL_PORT === '465'), // true for 465, false for other ports (like 587)
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS    
    },
    tls: {
        ciphers: 'SSLv3' // Set for Outlook compatibility, adjust if needed for other providers
    }
});

// Helper function to send user info
async function sendGitHubUserInfo(panel: vscode.WebviewPanel, token: string | null | undefined, context: vscode.ExtensionContext) { // Allow undefined token
    if (!token) {
        console.log('[IntelliGit] No token provided to sendGitHubUserInfo, sending null userInfo.');
        panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null });
        return;
    }
    console.log('[IntelliGit] Attempting to fetch GitHub user info.');

    const options = {
        hostname: 'api.github.com',
        path: '/user',
        method: 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': `VSCode-IntelliGit-Extension/${context.extension.packageJSON.version || '0.0.1'}`
        }
    };

    return new Promise<void>((resolve, reject) => {
        const req = https.request(options, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => { data += chunk; });
            res.on('end', async () => {
                try {
                    const responseBody = JSON.parse(data);
                    if (res.statusCode === 200) {
                        console.log('[IntelliGit] Successfully fetched GitHub user info for:', responseBody.login);
                        panel.webview.postMessage({
                            command: 'githubUserInfo',
                            userInfo: {
                                login: responseBody.login,
                                avatarUrl: responseBody.avatar_url,
                                name: responseBody.name 
                            }
                        });
                        resolve();
                    } else {
                        console.error(`[IntelliGit] GitHub API error fetching user info: ${res.statusCode} - ${data}`);
                        panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null, error: `GitHub API error: ${res.statusCode}. ${responseBody.message || 'Failed to fetch user info.'}` });
                        if (res.statusCode === 401) { 
                            console.log('[IntelliGit] Token is invalid (401). Clearing stored token.');
                            await context.secrets.delete('githubToken');
                            panel.webview.postMessage({ command: 'githubToken', token: null }); 
                        }
                        reject(new Error(`GitHub API error: ${res.statusCode}`));
                    }
                } catch (parseError: any) {
                    console.error('[IntelliGit] Error parsing GitHub user info response:', parseError, 'Raw data:', data);
                    panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null, error: 'Error parsing user info from GitHub.' });
                    reject(parseError);
                }
            });
        });
        req.on('error', (e: any) => {
            console.error('[IntelliGit] Network error fetching GitHub user info:', e);
            panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null, error: e.message });
            reject(e);
        });
        req.end();
    });
}

// Helper function to fetch repository details from GitHub API
async function fetchGitHubRepoDetails(owner: string, repo: string, token: string, context: vscode.ExtensionContext): Promise<{ fullName: string; defaultBranch: string; error?: string } | null> {
    console.log(`[IntelliGit] Attempting to fetch GitHub repo details for ${owner}/${repo}.`);
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}`,
        method: 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': `VSCode-IntelliGit-Extension/${context.extension.packageJSON.version || '0.0.1'}`
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => { data += chunk; });
            res.on('end', () => {
                try {
                    const responseBody = JSON.parse(data);
                    if (res.statusCode === 200) {
                        console.log(`[IntelliGit] Successfully fetched GitHub repo details for ${owner}/${repo}:`, responseBody.full_name, responseBody.default_branch);
                        resolve({ fullName: responseBody.full_name, defaultBranch: responseBody.default_branch });
                    } else {
                        const errorMessage = `GitHub API error fetching repo details: ${res.statusCode} - ${responseBody.message || data}`;
                        console.error(`[IntelliGit] ${errorMessage}`);
                        resolve({ fullName: '', defaultBranch: '', error: errorMessage });
                    }
                } catch (parseError: any) {
                    const errorMessage = `Error parsing GitHub repo details response: ${parseError.message}`;
                    console.error('[IntelliGit]', errorMessage, 'Raw data:', data);
                    resolve({ fullName: '', defaultBranch: '', error: errorMessage });
                }
            });
        });
        req.on('error', (e: any) => {
            const errorMessage = `Network error fetching GitHub repo details: ${e.message}`;
            console.error('[IntelliGit]', errorMessage, e);
            resolve({ fullName: '', defaultBranch: '', error: errorMessage });
        });
        req.end();
    });
}

// Helper function to ensure a directory URI exists
async function ensureDirectoryUriExists(directoryUri: vscode.Uri) {
    try {
        await vscode.workspace.fs.createDirectory(directoryUri);
        console.log(`[IntelliGit] Ensured directory exists: ${directoryUri.fsPath}`);
    } catch (error: any) {
        // Log and ignore if directory already exists, otherwise rethrow or handle
        if (error instanceof vscode.FileSystemError && (error.code === 'EEXIST' || error.code === 'FileExists')) {
            console.log(`[IntelliGit] Directory already exists, no action needed: ${directoryUri.fsPath}`);
        } else {
            console.warn(`[IntelliGit] Warning during ensureDirectoryUriExists for ${directoryUri.fsPath}:`, error.message);
            // Potentially re-throw if it's a critical error not related to existence
            // throw error; 
        }
    }
}

// Helper function to get the URI for the tasks.json file for a given repository (REMOVED as tasks are now in Firebase)
// function getRepoTaskFileUri(context: vscode.ExtensionContext, repoOwner: string, repoName: string): vscode.Uri { ... }


export async function activate(context: vscode.ExtensionContext) { // Made activate async
    console.log('[IntelliGit] Activating extension...');

    // Register URI Handler
    context.subscriptions.push(vscode.window.registerUriHandler({
        async handleUri(uri: vscode.Uri) {
            console.log(`[IntelliGit] URI Handler received URI: ${uri.toString()}`);
            if (uri.path === '/showAndFocusTask') {
                const queryParams = new URLSearchParams(uri.query);
                const taskId = queryParams.get('taskId');
                const repoOwner = queryParams.get('repoOwner');
                const repoName = queryParams.get('repoName');

                console.log(`[IntelliGit] Parsed from URI: taskId=${taskId}, repoOwner=${repoOwner}, repoName=${repoName}`);

                // 1. Ensure the panel is shown
                await vscode.commands.executeCommand('intelligit.showPanel');

                // 2. Send a message to the webview to focus the task
                // This requires the panel to be ready and listening. 
                // We might need a way to queue this message or wait for panel readiness.
                // For now, we'll assume the panel becomes active quickly after the command.
                // A more robust solution might involve a promise or event from the panel.
                
                // Find the active IntelliGit panel. This is a bit simplistic and assumes only one such panel.
                const activePanel = vscode.window.visibleTextEditors.find(editor => 
                    editor.document.uri.scheme === 'vscode-webview' && 
                    editor.document.uri.path.includes('intelliGitPanel') // Check if this is a reliable way to identify the panel
                );
                
                // A more direct way if we can get a reference to the panel created by 'intelligit.showPanel'
                // This is tricky because the URI handler is separate from the command that creates the panel.
                // One option is to store the panel reference globally in the extension, but that has its own issues.

                // For now, let's try to post to all active webviews that might be ours.
                // This is not ideal but a starting point.
                // A better approach: when the panel is created, it registers itself with a service or the extension context,
                // and the URI handler can then retrieve the active panel reference.

                // Let's assume the `intelligit.showPanel` command will make the panel active and it will handle an incoming message.
                // The webview needs to be listening for a 'focusTask' command.
                if (taskId && repoOwner && repoName) {
                    // Delay slightly to give the panel time to potentially open/initialize
                    setTimeout(() => {
                        // This is a placeholder for how you'd get the panel reference.
                        // In a real scenario, the panel created by `intelligit.showPanel` would need to expose its webview.
                        // For now, we'll rely on the webview itself to pick up a general message if it's open.
                        
                        // The webview's onDidReceiveMessage should handle 'focusTaskInPanel'
                        // We are sending this message to the extension, which then relays it to the webview.
                        // This is indirect. A direct `panel.webview.postMessage` would be better if `panel` was accessible here.
                        vscode.window.visibleTextEditors.forEach(editor => {
                            // This is a very broad check, needs to be specific to your webview panel
                            // A better way is if your webview panel registers itself upon creation
                            // and the URI handler can look it up.
                            // For now, this is a conceptual placeholder.
                            // A more robust way: the showPanel command could return the panel or store it.
                            // Since the URI handler is independent, we'll rely on the webview to listen for a specific message.
                        });

                        // The webview (React app) needs to listen for this message
                        // and then act upon it (e.g., scroll to the task, open details)
                        // This message will be caught by the `panel.webview.onDidReceiveMessage` in `activate`
                        // if the panel is already open. If it's just been opened, it should also pick it up.
                        // The webview's internal script (`getWebviewContent`) will then forward it to the iframe.
                        // The React app inside the iframe needs to handle `focusTaskInPanel`.

                        // The most reliable way is to have the `intelligit.showPanel` command, when it creates or reveals the panel,
                        // also handle focusing the task if parameters are provided. 
                        // The URI handler would then just trigger this command with parameters.
                        // For now, let's try posting a message that the webview should pick up.

                        // This message will be caught by the main `panel.webview.onDidReceiveMessage`
                        // and needs to be relayed to the React app.
                        // We'll add a new case there to handle it.
                        
                        // Send a message that the webview is expected to handle.
                        // This will be caught by the `panel.webview.onDidReceiveMessage` in `activate`.
                        // We need to ensure that the panel reference is available or that the message is broadcast
                        // in a way the active panel can receive it.

                        // A better approach: The URI handler calls `intelligit.showPanel`
                        // and `intelligit.showPanel` itself handles the task focusing logic if parameters are passed.
                        // Let's modify `intelligit.showPanel` to accept optional task focusing parameters.

                        // For now, let's just log and assume the panel will handle it via a new message type.
                        // The webview (React app) will need to listen for 'focusTask'
                        console.log(`[IntelliGit] Attempting to send 'focusTask' to webview with taskId: ${taskId}, repo: ${repoOwner}/${repoName}`);
                        // This is a conceptual post. The actual panel reference is needed.
                        // If `IntelliGitPanel.currentPanel` exists and is the active panel:
                        // IntelliGitPanel.currentPanel?.webview.postMessage({ command: 'focusTask', taskId, repoOwner, repoName });
                        // Since we don't have a direct reference here, we'll rely on the panel, once shown,
                        // to perhaps check for pending focus requests or receive a message.
                        // The simplest is to have the webview itself, upon loading or receiving a specific message,
                        // check for these parameters (e.g., via a new message type).

                        // Let's add a new message type for the webview to handle this.
                        // The webview will receive this via the relay.
                        // This assumes the panel is open and listening.
                        // We need to ensure the panel is created by `intelligit.showPanel` before this message is useful.
                        // The `await vscode.commands.executeCommand('intelligit.showPanel');` should handle this.

                        // The webview (React app) needs to handle this message.
                        // This message is sent from the extension to the webview.
                        // The `getWebviewContent` script will relay it to the iframe.
                        if (IntelliGitPanel.currentPanel) { // Assuming currentPanel is stored
                            IntelliGitPanel.currentPanel.webview.postMessage({ 
                                command: 'focusTaskInPanel', 
                                data: { taskId, repoOwner, repoName }
                            });
                            console.log("[IntelliGit] Posted 'focusTaskInPanel' to current panel's webview.");
                        } else {
                            console.warn("[IntelliGit] URI Handler: IntelliGitPanel.currentPanel is not set. Cannot post focusTaskInPanel message directly. The panel, once opened, should check for focus parameters.");
                            // As a fallback, store it and let the panel pick it up when it loads
                            context.workspaceState.update('pendingFocusTask', { taskId, repoOwner, repoName });
                        }
                    }, 500); // Small delay to allow panel to open
                }
            }
        }
    }));

    // Ensure the root global storage path for the extension exists
    try {
        await ensureDirectoryUriExists(context.globalStorageUri);
        // const taskDataRootUri = vscode.Uri.joinPath(context.globalStorageUri, 'task_data'); // No longer creating local task_data
        // await ensureDirectoryUriExists(taskDataRootUri);
        console.log('[IntelliGit] Global storage path ensured.');
    } catch (error) {
        console.error('[IntelliGit] Critical error creating global storage directory, task persistence might fail:', error);
        // Depending on how critical this is, you might want to show an error message to the user
    }

    try {
        console.log('[IntelliGit] Attempting to register command "intelligit.showPanel"...');
        let disposable = vscode.commands.registerCommand('intelligit.showPanel', async (focusParams?: { taskId: string, repoOwner: string, repoName: string }) => { // Made command handler async
            console.log('[IntelliGit] Command "intelligit.showPanel" executed.');
            
            if (IntelliGitPanel.currentPanel) {
                console.log('[IntelliGit] Panel already exists, revealing.');
                IntelliGitPanel.currentPanel.reveal(vscode.ViewColumn.One);
                 // If revealing an existing panel, also check for focusParams or pendingTask
                const taskToFocusReveal = focusParams || context.workspaceState.get<{ taskId: string, repoOwner: string, repoName: string }>('pendingFocusTask');
                if (taskToFocusReveal) {
                    console.log('[IntelliGit] showPanel (reveal): Attempting to focus task:', taskToFocusReveal);
                    IntelliGitPanel.currentPanel.webview.postMessage({
                        command: 'focusTaskInPanel',
                        data: taskToFocusReveal
                    });
                    await context.workspaceState.update('pendingFocusTask', undefined); // Clear pending task
                } else {
                    // If no specific task, ensure initial/last repo is sent if panel is re-activated
                    const lastActiveRepo = context.workspaceState.get<{ owner: string, name: string }>('lastActiveRepo');
                    if (lastActiveRepo) {
                        IntelliGitPanel.currentPanel.webview.postMessage({ command: 'initialRepository', data: lastActiveRepo });
                    }
                }
            } else {
                console.log('[IntelliGit] Creating new panel.');
                const newPanel = vscode.window.createWebviewPanel(
                    'intelliGitPanel', // Identifies the type of the webview. Used internally
                    'IntelliGit', // Title of the panel displayed to the user
                    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true,
                        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media'), vscode.Uri.joinPath(context.extensionUri, 'out')]
                    }
                );
                IntelliGitPanel.currentPanel = newPanel; // Store the panel reference

                const appUrl = 'http://localhost:9002'; // Your web app's URL
                newPanel.webview.html = getWebviewContent(newPanel.webview, context.extensionUri, appUrl);

                newPanel.onDidDispose(() => {
                    IntelliGitPanel.currentPanel = undefined;
                    console.log('[IntelliGit] Panel disposed.');
                }, null, context.subscriptions);

                // Handle focus task if parameters are provided (e.g., from URI handler or internal call)
                // This block is now inside the 'else' for new panel creation
                const taskToFocusCreate = focusParams || context.workspaceState.get<{ taskId: string, repoOwner: string, repoName: string }>('pendingFocusTask');
                if (taskToFocusCreate) {
                    console.log('[IntelliGit] showPanel (create): Attempting to focus task:', taskToFocusCreate);
                    // Message will be sent once webview is ready (see 'webviewReady' message handling)
                    // For now, we can store it or rely on webviewReady to pick it up.
                    // Storing it in workspaceState is already done by URI handler if panel wasn't ready.
                    // The 'webviewReady' handler will check 'pendingFocusTask'.
                } else {
                    // Attempt to load and send the last active repository if no specific task to focus
                    // This will also be handled by 'webviewReady' if it's a new panel.
                    const lastActiveRepo = context.workspaceState.get<{ owner: string, name: string }>('lastActiveRepo');
                    if (lastActiveRepo) {
                        console.log('[IntelliGit] New panel, lastActiveRepo found:', lastActiveRepo);
                        // The 'webviewReady' message handler will send initialRepository for new panels.
                    }
                }
                
                // Setup message handler for the new panel
                newPanel.webview.onDidReceiveMessage(
                    async message => { 
                        console.log(`[IntelliGit] Message received from webview. Command: ${message?.command}, Full message:`, message);
                        const currentWebview = IntelliGitPanel.currentPanel?.webview; // Use currentPanel here
                        if (!currentWebview) {
                            console.error("[IntelliGit] Critical: No current webview panel found in onDidReceiveMessage. Aborting message processing.");
                            return;
                        }

                        switch (message.command) {
                            case 'requestGitHubToken': 
                                try {
                                    let token: string | undefined = await context.secrets.get('githubToken');
                                    let session: vscode.AuthenticationSession | undefined;
                                    if (token) {
                                        try {
                                            session = await vscode.authentication.getSession('github', ['repo', 'read:user'], { silent: true });
                                            if (!session || session.accessToken !== token) {
                                                await context.secrets.delete('githubToken');
                                                token = undefined;
                                            }
                                        } catch (e) {
                                            await context.secrets.delete('githubToken');
                                            token = undefined;
                                        }
                                    }
                                    if (!token) { 
                                        session = await vscode.authentication.getSession('github', ['repo', 'read:user'], { createIfNone: true });
                                        if (session) {
                                            token = session.accessToken;
                                            await context.secrets.store('githubToken', token);
                                        }
                                    }
                                    if (token && IntelliGitPanel.currentPanel) {
                                        currentWebview.postMessage({ command: 'githubToken', token: token });
                                        await sendGitHubUserInfo(IntelliGitPanel.currentPanel, token, context); 
                                    } else {
                                        currentWebview.postMessage({ command: 'githubToken', token: null, error: 'GitHub authentication could not be established.' });
                                        currentWebview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                        await context.secrets.delete('githubToken'); 
                                    }
                                } catch (error: any) {
                                    currentWebview.postMessage({ command: 'githubToken', token: null, error: error.message || 'GitHub authentication failed.' });
                                    currentWebview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                    await context.secrets.delete('githubToken');
                                }
                                return;
                            case 'requestGitHubLogin': 
                                try {
                                    const session = await vscode.authentication.getSession('github', ['repo', 'read:user'], { createIfNone: true });
                                    if (session && IntelliGitPanel.currentPanel) {
                                        await context.secrets.store('githubToken', session.accessToken);
                                        currentWebview.postMessage({ command: 'githubToken', token: session.accessToken });
                                        await sendGitHubUserInfo(IntelliGitPanel.currentPanel, session.accessToken, context);
                                    } else {
                                        currentWebview.postMessage({ command: 'githubToken', token: null, error: 'GitHub login failed or was cancelled by user.'});
                                        currentWebview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                        await context.secrets.delete('githubToken');
                                    }
                                } catch (error: any) {
                                    currentWebview.postMessage({ command: 'githubToken', token: null, error: error.message || 'GitHub login failed.' });
                                    currentWebview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                    await context.secrets.delete('githubToken');
                                }
                                return;
                            case 'requestGitHubLogout':
                                try {
                                    await context.secrets.delete('githubToken');
                                    currentWebview.postMessage({ command: 'githubToken', token: null });
                                    currentWebview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                    vscode.window.showInformationMessage('Successfully logged out of GitHub.');
                                } catch (error: any) {
                                    currentWebview.postMessage({ command: 'githubToken', token: null }); 
                                    currentWebview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                }
                                return;
                            case 'requestRepositoryInfo':
                                let repositoryName: string | null = null;
                                let currentBranch: string | null = null;
                                let repoInfoError: string | null = null;
                                let determinedRepoOwner: string | null = null;
                                const { githubRepoOwner, githubRepoName: githubRepoNameFromMessage } = message;
                                if (githubRepoOwner && githubRepoNameFromMessage) {
                                    const token = await context.secrets.get('githubToken');
                                    if (token && IntelliGitPanel.currentPanel) {
                                        const repoDetails = await fetchGitHubRepoDetails(githubRepoOwner, githubRepoNameFromMessage, token, context);
                                        if (repoDetails && repoDetails.fullName && repoDetails.defaultBranch && !repoDetails.error) {
                                            repositoryName = repoDetails.fullName;
                                            currentBranch = repoDetails.defaultBranch;
                                            determinedRepoOwner = githubRepoOwner;
                                        } else {
                                            repoInfoError = `Failed to fetch from GitHub API: ${repoDetails?.error || 'Unknown API error.'}`;
                                        }
                                    } else {
                                        const noTokenError = 'No GitHub token available to fetch repository details from API.';
                                        repoInfoError = repoInfoError ? `${repoInfoError} ${noTokenError}` : noTokenError;
                                    }
                                }
                                if (!repositoryName || !currentBranch) {
                                    const workspaceFolders = vscode.workspace.workspaceFolders;
                                    if (workspaceFolders && workspaceFolders.length > 0) {
                                        const workspacePath = workspaceFolders[0].uri.fsPath;
                                        const execPromise = (cmd: string, options: any) => new Promise<{stdout: string, stderr: string}>((resolve) => {
                                            exec(cmd, options, (err, stdoutBuffer, stderrBuffer) => {
                                                const stdout = stdoutBuffer.toString();
                                                const stderr = stderrBuffer.toString();
                                                if (err) {
                                                    resolve({stdout: '', stderr: stderr || err.message});
                                                    return;
                                                }
                                                resolve({stdout, stderr});
                                            });
                                        });
                                        const remoteResult = await execPromise('git remote get-url origin', { cwd: workspacePath });
                                        if (remoteResult.stderr || !remoteResult.stdout.trim()) {
                                            const remoteError = `Could not get remote URL: ${remoteResult.stderr || 'No remote URL found.'}`;
                                            repoInfoError = repoInfoError ? `${repoInfoError} ${remoteError}` : remoteError;
                                            if (workspaceFolders[0]?.name && !repositoryName) { repositoryName = workspaceFolders[0].name; }
                                        } else {
                                            const remoteUrl = remoteResult.stdout.trim();
                                            const match = remoteUrl.match(/github\.com[\/:]([^\/]+\/[^\/.]+?)(\.git)?$/i);
                                            if (match && match[1]) {
                                                if(!repositoryName) { repositoryName = match[1]; }
                                                if(!determinedRepoOwner) { determinedRepoOwner = match[1].split('/')[0]; }
                                            } else {
                                                const parseError = `Could not parse repository name from remote URL: ${remoteUrl}.`;
                                                repoInfoError = repoInfoError ? `${repoInfoError} ${parseError}` : parseError;
                                                if (workspaceFolders[0]?.name && !repositoryName) { repositoryName = workspaceFolders[0].name; }
                                            }
                                        }
                                        if (!currentBranch) {
                                            const branchResult = await execPromise('git rev-parse --abbrev-ref HEAD', { cwd: workspacePath });
                                            if (branchResult.stderr || !branchResult.stdout.trim()) {
                                                const branchError = `Could not get current branch: ${branchResult.stderr || 'No branch info found.'}`;
                                                repoInfoError = repoInfoError ? `${repoInfoError} ${branchError}` : branchError;
                                            } else {
                                                currentBranch = branchResult.stdout.trim();
                                            }
                                        }
                                    } else if (!repositoryName && !currentBranch) {
                                        const noWorkspaceError = 'No workspace folder open, and no GitHub repo info provided/fetched.';
                                        repoInfoError = repoInfoError ? `${repoInfoError} ${noWorkspaceError}` : noWorkspaceError;
                                    }
                                }
                                if (!repositoryName) { repositoryName = "N/A"; }
                                if (!currentBranch) { currentBranch = "N/A"; }
                                if (determinedRepoOwner && repositoryName && repositoryName !== "N/A" && !repoInfoError) {
                                    const repoNameOnly = repositoryName.includes('/') ? repositoryName.split('/')[1] : repositoryName;
                                    await context.workspaceState.update('lastActiveRepo', { owner: determinedRepoOwner, name: repoNameOnly });
                                }
                                currentWebview.postMessage({
                                    command: 'repositoryInfo',
                                    name: repositoryName,
                                    branch: currentBranch,
                                    owner: determinedRepoOwner,
                                    error: repoInfoError
                                });
                                break;
                            case 'sendTaskNotification':
                                if (message.payload && message.payload.assigneeEmail) {
                                    vscode.window.showInformationMessage(`Task "${message.payload.taskTitle}" assigned to ${message.payload.assigneeName}. Preparing email.`);
                                    try {
                                        const emailTemplatePath = vscode.Uri.joinPath(context.extensionUri, 'src', 'emailTemplate.html').fsPath;
                                        let htmlContent = fs.readFileSync(emailTemplatePath, 'utf8');
                                        htmlContent = htmlContent.replace(/\[AssigneeName\]/g, message.payload.assigneeName || 'Contributor');
                                        htmlContent = htmlContent.replace(/\[TaskTitle\]/g, message.payload.taskTitle || 'N/A');
                                        htmlContent = htmlContent.replace(/\[TaskDescription\]/g, message.payload.taskDescription || 'No description provided.');
                                        htmlContent = htmlContent.replace(/\[DueDate\]/g, message.payload.dueDate ? new Date(message.payload.dueDate).toLocaleDateString() : 'Not specified');
                                        const subtasks = message.payload.subtasks || [];
                                        let subtasksHtml = '<p>No subtasks for this task.</p>';
                                        if (subtasks.length > 0) {
                                            subtasksHtml = '<ul style="padding-left: 0; list-style-type: none;">';
                                            subtasks.forEach((subtask: { title: string; completed: boolean }) => {
                                                const icon = subtask.completed ? '<span class="checkbox-icon">✔</span>' : '<span class="checkbox-icon-empty"></span>';
                                                subtasksHtml += `<li class="subtask-item ${subtask.completed ? 'completed' : ''}">${icon}<span>${subtask.title}</span></li>`;
                                            });
                                            subtasksHtml += '</ul>';
                                        }
                                        htmlContent = htmlContent.replace(/\[SubtasksHTML\]/g, subtasksHtml);
                                        const attachments = message.payload.attachments || [];
                                        let attachmentsHtml = '<p>No attachments for this task.</p>';
                                        if (attachments.length > 0) {
                                            attachmentsHtml = '<ul style="padding-left: 0; list-style-type: none;">';
                                            attachments.forEach((attachment: { name: string; url: string }) => {
                                                attachmentsHtml += `<li class="attachment-item"><a href="${attachment.url || '#'}" style="color: #58A6FF; text-decoration: none;">${attachment.name}</a></li>`;
                                            });
                                            attachmentsHtml += '</ul>';
                                        }
                                        htmlContent = htmlContent.replace(/\[AttachmentsHTML\]/g, attachmentsHtml);
                                        htmlContent = htmlContent.replace(/\[RepositoryName\]/g, message.payload.repositoryName || 'N/A');
                                        htmlContent = htmlContent.replace(/\[RepositoryLink\]/g, message.payload.repositoryLink || '#');
                                        htmlContent = htmlContent.replace(/\[BranchName\]/g, message.payload.branchName || 'N/A');
                                        htmlContent = htmlContent.replace(/\[AssignerName\]/g, message.payload.assignerName || 'System');
                                        htmlContent = htmlContent.replace(/\[AssignerProfileLink\]/g, message.payload.assignerProfileLink || '#');
                                        htmlContent = htmlContent.replace(/\[TaskLink\]/g, message.payload.taskLink || '#');
                                        htmlContent = htmlContent.replace(/\[VSCodeLink\]/g, message.payload.vscodeLink || '#');
                                        htmlContent = htmlContent.replace(/\[CurrentYear\]/g, new Date().getFullYear().toString());
                                        await transporter.sendMail({
                                            from: `"IntelliGit Task Notifier" <${process.env.EMAIL_USER}>`,
                                            to: message.payload.assigneeEmail,
                                            subject: `New Task Assigned: ${message.payload.taskTitle}`,
                                            html: htmlContent,
                                        });
                                        vscode.window.showInformationMessage(`Email for task "${message.payload.taskTitle}" sent to ${message.payload.assigneeName}.`);
                                    } catch (emailError: any) {
                                        const nameForWarning = message.payload.assigneeName || 'the assignee';
                                        vscode.window.showErrorMessage(`Failed to send task assignment email to ${nameForWarning}: ${emailError.message}`);
                                    }
                                } else {
                                    vscode.window.showWarningMessage('Could not send task notification: Critical task information missing.');
                                }
                                return;
                            case 'loadTasks': {
                                const { repoOwner, repoName } = message.data;
                                if (!repoOwner || !repoName) {
                                    currentWebview.postMessage({ command: 'tasksLoaded', tasks: [], error: 'Missing repository information for loading tasks.' });
                                    break;
                                }
                                if (admin.apps.length === 0 || !db) { // Check if Firebase is initialized
                                    console.error('[IntelliGit] Firebase is not initialized. Cannot load tasks.');
                                    currentWebview.postMessage({ command: 'tasksLoaded', tasks: [], error: 'Firebase is not initialized. Cannot load tasks.' });
                                    break;
                                }
                                // console.warn('[IntelliGit] Firebase is temporarily disabled. Skipping loadTasks.');
                                // currentWebview.postMessage({ command: 'tasksLoaded', tasks: [], error: 'Firebase is temporarily disabled. Cannot load tasks.' });
                                const repoDocId = `${repoOwner.toLowerCase()}_${repoName.toLowerCase()}`;
                                try {
                                    console.log(`[IntelliGit] Attempting to load tasks from Firestore for repo: ${repoDocId}`);
                                    const repoDocRef = db.collection('repositories').doc(repoDocId);
                                    const docSnap = await repoDocRef.get();
                                    if (docSnap.exists) {
                                        const repoData = docSnap.data();
                                        const tasks = repoData?.tasks || [];
                                        console.log(`[IntelliGit] Tasks loaded successfully for ${repoDocId}. Task count: ${tasks.length}`);
                                        currentWebview.postMessage({ command: 'tasksLoaded', tasks: tasks });
                                    } else {
                                        console.log(`[IntelliGit] No tasks document found for ${repoDocId}. Returning empty array.`);
                                        currentWebview.postMessage({ command: 'tasksLoaded', tasks: [] });
                                    }
                                } catch (error: any) {
                                    console.error(`[IntelliGit] Error loading tasks from Firestore for ${repoDocId}:`, error);
                                    currentWebview.postMessage({ command: 'tasksLoaded', tasks: [], error: `Failed to load tasks: ${error.message}` });
                                }
                                break;
                            }
                            case 'saveTasks': {
                                const { repoOwner, repoName, tasks } = message.data;
                                if (!repoOwner || !repoName || tasks === undefined) {
                                    currentWebview.postMessage({ command: 'tasksSaved', success: false, error: 'Missing data for saving tasks.' });
                                    break;
                                }
                                if (admin.apps.length === 0 || !db) { // Check if Firebase is initialized
                                    console.error('[IntelliGit] Firebase is not initialized. Cannot save tasks.');
                                    currentWebview.postMessage({ command: 'tasksSaved', success: false, error: 'Firebase is not initialized. Cannot save tasks.' });
                                    break;
                                }
                                // console.warn('[IntelliGit] Firebase is temporarily disabled. Skipping saveTasks.');
                                // currentWebview.postMessage({ command: 'tasksSaved', success: false, error: 'Firebase is temporarily disabled. Cannot save tasks.' });
                                const repoDocId = `${repoOwner.toLowerCase()}_${repoName.toLowerCase()}`;
                                try {
                                    console.log(`[IntelliGit] Attempting to save ${tasks.length} tasks to Firestore for repo: ${repoDocId}`);
                                    const repoDocRef = db.collection('repositories').doc(repoDocId);
                                    await repoDocRef.set({ tasks: tasks }, { merge: true });
                                    console.log(`[IntelliGit] Tasks saved successfully to Firestore for ${repoDocId}.`);
                                    currentWebview.postMessage({ command: 'tasksSaved', success: true });
                                } catch (error: any) {
                                    console.error(`[IntelliGit] Error saving tasks to Firestore for ${repoDocId}:`, error);
                                    currentWebview.postMessage({ command: 'tasksSaved', success: false, error: `Failed to save tasks: ${error.message}` });
                                }
                                break;
                            }
                            case 'webviewReady':
                                console.log('[IntelliGit] Webview reported ready.');
                                const pendingTask = context.workspaceState.get<{ taskId: string, repoOwner: string, repoName: string }>('pendingFocusTask');
                                if (pendingTask) {
                                    currentWebview.postMessage({
                                        command: 'focusTaskInPanel',
                                        data: pendingTask
                                    });
                                    await context.workspaceState.update('pendingFocusTask', undefined);
                                } else {
                                    const lastActiveRepo = context.workspaceState.get<{ owner: string, name: string }>('lastActiveRepo');
                                    if (lastActiveRepo) {
                                        currentWebview.postMessage({ command: 'initialRepository', data: lastActiveRepo });
                                    }
                                }
                                break;
                            // --- Firebase User Session Persistence ---
                            case 'saveUserSession': {
                                const { userId, session } = message;
                                if (userId && session) {
                                    await saveUserSessionToFirebase(userId, session);
                                    currentWebview.postMessage({ command: 'userSessionSaved', success: true });
                                } else {
                                    currentWebview.postMessage({ command: 'userSessionSaved', success: false, error: 'Missing userId or session.' });
                                }
                                break;
                            }
                            case 'loadUserSession': {
                                const { userId } = message;
                                if (userId) {
                                    const session = await loadUserSessionFromFirebase(userId);
                                    currentWebview.postMessage({ command: 'userSessionLoaded', session });
                                } else {
                                    currentWebview.postMessage({ command: 'userSessionLoaded', session: null, error: 'Missing userId.' });
                                }
                                break;
                            }
                        }
                    },
                    undefined,
                    context.subscriptions
                );
            } // This closes the 'else' block for new panel creation
        }); // This closes registerCommand

        context.subscriptions.push(disposable);
        console.log('[IntelliGit] Command "intelligit.showPanel" registration successful.');
    } catch (error) {
        console.error('[IntelliGit] Error during command registration:', error);
        vscode.window.showErrorMessage('IntelliGit failed to activate. Check logs.');
    }

    console.log('[IntelliGit] Activation complete.');
}

class IntelliGitPanel {
    public static currentPanel: vscode.WebviewPanel | undefined;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, appUrl: string) {
    const nonce = getNonce();

    const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:; script-src 'nonce-${nonce}'; frame-src ${appUrl};`;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IntelliGit</title>
        <style>
            body, html, iframe {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                border: none;
            }
        </style>
    </head>
    <body>
        <iframe src="${appUrl}" id="appFrame"></iframe>
        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            const iframe = document.getElementById('appFrame');
            const targetOrigin = new URL("${appUrl}").origin;

            console.log('[WebviewHost] Relay script loaded. Target origin for iframe:', targetOrigin);

            window.addEventListener('message', (eventAsAny) => {
                const event = eventAsAny; // Using as any for simplicity in inline script

                // Log ALL messages received by this window (the webview host page)
                console.log('[WebviewHost] Raw message received by host page:', {
                    data: event.data,
                    origin: event.origin,
                    sourceIsWindow: event.source === window,
                    sourceIsIframeContentWindow: event.source === iframe.contentWindow,
                });

                // Case 1: Message from iframe, destined for the extension
                if (event.source === iframe.contentWindow && event.origin === targetOrigin) {
                    console.log('[WebviewHost] Processing as: Message from iframe (to extension):', event.data);
                    if (event.data && event.data.command) {
                        vscode.postMessage(event.data);
                    } else {
                        console.warn('[WebviewHost] Message from iframe missing command:', event.data);
                    }
                }
                // Case 2: Message from extension (panel.webview.postMessage), destined for the iframe
                // This condition handles messages that are NOT from the iframe but are intended for it.
                // We rely on the fact that if it's not from the iframe (checked above), and it has a command,
                // it's from the extension host. The origin will be the webview's own origin.
                else if (event.data && event.data.command) {
                    // This block will now handle messages from the extension.
                    // We know event.source is not iframe.contentWindow here (due to the first 'if').
                    // We also know event.origin is not targetOrigin (iframe's origin) for these messages.
                    console.log('[WebviewHost] Processing as: Potential message from extension (not from iframe, has command). Data:', event.data, 'Origin:', event.origin);
                    
                    console.log('[WebviewHost] Confirmed message for iframe. Relaying to iframe. TargetOrigin:', targetOrigin, 'Iframe contentWindow exists:', !!iframe.contentWindow);
                    if (iframe.contentWindow) {
                        try {
                            iframe.contentWindow.postMessage(event.data, targetOrigin);
                            console.log('[WebviewHost] Message successfully posted to iframe:', event.data);
                        } catch (e) {
                            console.error('[WebviewHost] Error posting message to iframe:', e, 'Data:', event.data, 'TargetOrigin:', targetOrigin);
                        }
                    } else {
                        console.warn('[WebviewHost] iframe.contentWindow is null. Cannot post message to iframe.');
                    }
                }
                // Case 3: Log if not handled by above (e.g., no command, or unexpected source/origin)
                else {
                    console.log('[WebviewHost] Message not processed by primary handlers (e.g., no command, or unexpected source/origin). Data:', event.data, 'Origin:', event.origin);
                }
            });
        </script>
    </body>
    </html>`;
}

// This method is called when your extension is deactivated
export async function deactivate() { // Made deactivate async (good practice, though not strictly needed here)
    console.log('[IntelliGit] Deactivating extension.');
}

// --- Firebase User Session Persistence ---
/**
 * Save the user's last connected repo session to Firestore.
 * @param userId string (GitHub login or email)
 * @param session { owner: string, name: string, branch?: string }
 */
async function saveUserSessionToFirebase(userId: string, session: { owner: string, name: string, branch?: string }) {
  if (!db) { return; }
  try {
    await db.collection('userSessions').doc(userId).set({ lastSession: session }, { merge: true });
    console.log(`[IntelliGit] Saved user session for ${userId}:`, session);
  } catch (e) {
    console.error(`[IntelliGit] Failed to save user session for ${userId}:`, e);
  }
}

/**
 * Load the user's last connected repo session from Firestore.
 * @param userId string (GitHub login or email)
 * @returns session or null
 */
async function loadUserSessionFromFirebase(userId: string): Promise<{ owner: string, name: string, branch?: string } | null> {
  if (!db) { return null; }
  try {
    const doc = await db.collection('userSessions').doc(userId).get();
    if (doc.exists && doc.data()?.lastSession) {
      console.log(`[IntelliGit] Loaded user session for ${userId}:`, doc.data()?.lastSession);
      return doc.data()?.lastSession;
    }
  } catch (e) {
    console.error(`[IntelliGit] Failed to load user session for ${userId}:`, e);
  }
  return null;
}
