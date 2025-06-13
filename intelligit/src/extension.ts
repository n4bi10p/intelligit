// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as https from 'https'; // Added for making HTTPS requests to GitHub API

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

export function activate(context: vscode.ExtensionContext) {
    console.log('[IntelliGit] Activating extension...');

    try {
        console.log('[IntelliGit] Attempting to register command "intelligit.showPanel"...');
        let disposable = vscode.commands.registerCommand('intelligit.showPanel', () => {
            console.log('[IntelliGit] Command "intelligit.showPanel" executed.');
            const panel = vscode.window.createWebviewPanel(
                'intelliGitPanel',
                'IntelliGit',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true, // Keep context when hidden
                    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')] // Example if loading local resources
                }
            );

            const appUrl = 'http://localhost:9002';
            panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, appUrl);

            // Handle messages from the webview (relayed by the script in getWebviewContent)
            panel.webview.onDidReceiveMessage(
                async message => {
                    console.log(`[IntelliGit] Message received from webview. Command: ${message?.command}, Full message:`, message);
                    switch (message.command) {
                        case 'requestGitHubToken': // Typically called on webview load
                            try {
                                let token: string | undefined = await context.secrets.get('githubToken');
                                let session: vscode.AuthenticationSession | undefined;

                                if (token) {
                                    try {
                                        // Silently verify if the stored token corresponds to an active session
                                        session = await vscode.authentication.getSession('github', ['repo', 'read:user'], { silent: true });
                                        if (!session || session.accessToken !== token) {
                                            console.log('[IntelliGit] Stored token invalid or mismatched. Clearing.');
                                            await context.secrets.delete('githubToken');
                                            token = undefined; 
                                        }
                                    } catch (e) {
                                        console.warn('[IntelliGit] Error during silent session check, clearing token:', e);
                                        await context.secrets.delete('githubToken');
                                        token = undefined;
                                    }
                                }

                                if (!token) { 
                                    console.log('[IntelliGit] No valid token in secrets, attempting to get/create new session.');
                                    session = await vscode.authentication.getSession('github', ['repo', 'read:user'], { createIfNone: true });
                                    if (session) {
                                        token = session.accessToken;
                                        await context.secrets.store('githubToken', token);
                                        console.log('[IntelliGit] New session obtained and token stored.');
                                    }
                                }

                                if (token) {
                                    panel.webview.postMessage({ command: 'githubToken', token: token });
                                    await sendGitHubUserInfo(panel, token, context);
                                } else {
                                    panel.webview.postMessage({ command: 'githubToken', token: null, error: 'GitHub authentication could not be established.' });
                                    panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                    await context.secrets.delete('githubToken'); // Ensure secrets cleared
                                }
                            } catch (error: any) {
                                console.error('[IntelliGit] GitHub authentication error in requestGitHubToken:', error);
                                panel.webview.postMessage({ command: 'githubToken', token: null, error: error.message || 'GitHub authentication failed.' });
                                panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                await context.secrets.delete('githubToken');
                            }
                            return;

                        case 'requestGitHubLogin': // User explicitly clicks login
                            console.log('[IntelliGit] Entered requestGitHubLogin case.');
                            try {
                                console.log('[IntelliGit] requestGitHubLogin: Attempting to force new session via vscode.authentication.getSession.');
                                const session = await vscode.authentication.getSession('github', ['repo', 'read:user'], { createIfNone: true });
                                console.log('[IntelliGit] requestGitHubLogin: vscode.authentication.getSession call completed. Session object:', session);

                                if (session) {
                                    await context.secrets.store('githubToken', session.accessToken);
                                    panel.webview.postMessage({ command: 'githubToken', token: session.accessToken });
                                    await sendGitHubUserInfo(panel, session.accessToken, context);
                                    console.log('[IntelliGit] requestGitHubLogin: Login successful, token stored and info sent.');
                                } else {
                                    panel.webview.postMessage({ command: 'githubToken', token: null, error: 'GitHub login failed or was cancelled by user (session is null/undefined).', details: 'Session object was null or undefined after getSession call.' });
                                    panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                    await context.secrets.delete('githubToken');
                                    console.log('[IntelliGit] requestGitHubLogin: Login failed or cancelled by user (session is null/undefined).');
                                }
                            } catch (error: any) {
                                console.error('[IntelliGit] GitHub login error in requestGitHubLogin catch block:', error);
                                panel.webview.postMessage({ command: 'githubToken', token: null, error: error.message || 'GitHub login failed due to an error.', details: error.toString() });
                                panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                await context.secrets.delete('githubToken');
                            }
                            return;

                        case 'requestGitHubLogout':
                            try {
                                console.log('[IntelliGit] requestGitHubLogout: Clearing token.');
                                await context.secrets.delete('githubToken');
                                panel.webview.postMessage({ command: 'githubToken', token: null });
                                panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null });
                                vscode.window.showInformationMessage('Successfully logged out of GitHub.');
                                console.log('[IntelliGit] requestGitHubLogout: Logout successful.');
                            } catch (error: any) {
                                console.error('[IntelliGit] GitHub logout error:', error);
                                panel.webview.postMessage({ command: 'githubToken', token: null }); // Still inform webview
                                panel.webview.postMessage({ command: 'githubUserInfo', userInfo: null });
                            }
                            return;

                        case 'requestRepositoryInfo': // Added basic handler
                            console.log('[IntelliGit] Received requestRepositoryInfo from webview.');
                            const workspaceFoldersForInfo = vscode.workspace.workspaceFolders;
                            if (workspaceFoldersForInfo && workspaceFoldersForInfo.length > 0) {
                                const workspacePathForInfo = workspaceFoldersForInfo[0].uri.fsPath;
                                // Attempt to get git remote URL
                                exec('git remote get-url origin', { cwd: workspacePathForInfo }, (error, stdout, stderr) => {
                                    if (error) {
                                        console.warn(`[IntelliGit] Could not get remote URL: ${stderr || error.message}`);
                                        panel.webview.postMessage({ command: 'repositoryInfo', owner: null, repo: null, error: 'Could not determine repository from git remote.' });
                                        return;
                                    }
                                    const remoteUrl = stdout.trim();
                                    // Basic parsing for https://github.com/owner/repo.git or git@github.com:owner/repo.git
                                    const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(\.git)?$/i);
                                    if (match && match[1] && match[2]) {
                                        panel.webview.postMessage({ command: 'repositoryInfo', owner: match[1], repo: match[2] });
                                    } else {
                                        panel.webview.postMessage({ command: 'repositoryInfo', owner: null, repo: null, error: 'Could not parse owner/repo from remote URL.' });
                                    }
                                });
                            } else {
                                panel.webview.postMessage({ command: 'repositoryInfo', owner: null, repo: null, error: 'No workspace folder open.' });
                            }
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );

            panel.onDidDispose(
                () => {
                    console.log('[IntelliGit] Panel disposed.'); // New log
                },
                null,
                context.subscriptions
            );
        });

        context.subscriptions.push(disposable);
        console.log('[IntelliGit] Command "intelligit.showPanel" registration successful.'); // New log
    } catch (error) {
        console.error('[IntelliGit] Error during command registration:', error); // New log for errors
        vscode.window.showErrorMessage('IntelliGit failed to activate. Check logs.');
    }

    console.log('[IntelliGit] Activation complete.'); // New log
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
export function deactivate() {
    console.log('[IntelliGit] Deactivating extension.'); // New log
}
