// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
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
                message => {
                    console.log('[IntelliGit] Message received from webview:', message);
                    switch (message.command) {
                        case 'helloFromWebview':
                            vscode.window.showInformationMessage(`Received: ${message.text}`);
                            // Example: Send a response back to the webview
                            panel.webview.postMessage({ 
                                command: 'responseFromExtension', 
                                payload: 'Hello back from the extension! (Received: ' + message.text + ')' 
                            });
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

    // CSP to allow iframe, inline styles, our nonce-based script, and images from vscode resources and data URIs.
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

            // Relay messages from iframe to extension
            window.addEventListener('message', event => {
                if (event.source === iframe.contentWindow && event.origin === targetOrigin) {
                    console.log('[WebviewHost] Message from iframe:', event.data);
                    vscode.postMessage(event.data);
                }
            });

            // Relay messages from extension to iframe
            window.addEventListener('message', event => {
                // Check if the message is from the extension itself (not from the iframe)
                // Simple check: if event.source is window (meaning it's from panel.webview.postMessage)
                // and not from the iframe.
                if (event.source === window && iframe.contentWindow) {
                     console.log('[WebviewHost] Message from extension:', event.data);
                    iframe.contentWindow.postMessage(event.data, targetOrigin);
                }
            });
            console.log('[WebviewHost] Relay script loaded.');
        </script>
    </body>
    </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('[IntelliGit] Deactivating extension.'); // New log
}
