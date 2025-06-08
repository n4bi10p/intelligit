// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('[IntelliGit] Activating extension...'); // New log

    try {
        console.log('[IntelliGit] Attempting to register command "intelligit.showPanel"...'); // New log
        let disposable = vscode.commands.registerCommand('intelligit.showPanel', () => {
            console.log('[IntelliGit] Command "intelligit.showPanel" executed.'); // New log
            const panel = vscode.window.createWebviewPanel(
                'intelliGitPanel',
                'IntelliGit',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                }
            );
            panel.webview.html = getWebviewContent('http://localhost:9002');
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

function getWebviewContent(appUrl: string) {
    // In a real extension, you would want to make sure the URL is safe
    // and potentially embed a nonce for security.
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${appUrl} https:; style-src 'unsafe-inline';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IntelliGit</title>
        <style>
            body, html, #root, iframe {
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
    </body>
    </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('[IntelliGit] Deactivating extension.'); // New log
}
