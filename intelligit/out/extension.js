"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var import_child_process = require("child_process");
function activate(context) {
  console.log("[IntelliGit] Activating extension...");
  try {
    console.log('[IntelliGit] Attempting to register command "intelligit.showPanel"...');
    let disposable = vscode.commands.registerCommand("intelligit.showPanel", () => {
      console.log('[IntelliGit] Command "intelligit.showPanel" executed.');
      const panel = vscode.window.createWebviewPanel(
        "intelliGitPanel",
        "IntelliGit",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          // Keep context when hidden
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")]
          // Example if loading local resources
        }
      );
      const appUrl = "http://localhost:9002";
      panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, appUrl);
      panel.webview.onDidReceiveMessage(
        async (message) => {
          console.log("[IntelliGit] Message received from webview:", message);
          switch (message.command) {
            case "helloFromWebview":
              vscode.window.showInformationMessage(`Received: ${message.text}`);
              const responsePayload = {
                command: "responseFromExtension",
                payload: "Hello back from the extension! (Received: " + message.text + ")"
              };
              console.log("[IntelliGit] Posting message back to webview:", responsePayload);
              panel.webview.postMessage(responsePayload);
              return;
            case "getGitLog":
              console.log("[IntelliGit] Received getGitLog request from webview.");
              const workspaceFolders = vscode.workspace.workspaceFolders;
              if (!workspaceFolders || workspaceFolders.length === 0) {
                console.error("[IntelliGit] No workspace folder open.");
                panel.webview.postMessage({ command: "gitLogResponse", payload: [], error: "No workspace folder open." });
                return;
              }
              const workspacePath = workspaceFolders[0].uri.fsPath;
              console.log(`[IntelliGit] Workspace path: ${workspacePath}`);
              const fieldSeparator = "";
              const gitLogFormat = ["%H", "%an", "%ae", "%cI", "%s", "%b", "%P", "%D"].join(fieldSeparator);
              const gitLogCommand = `git log --pretty=format:"${gitLogFormat}" --date=iso-strict --decorate=full -z --max-count=50`;
              console.log(`[IntelliGit] Executing command: ${gitLogCommand} in ${workspacePath}`);
              (0, import_child_process.exec)(gitLogCommand, { cwd: workspacePath, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
                if (error) {
                  console.error(`[IntelliGit] Error executing git log: ${error.message}`);
                  console.error(`[IntelliGit] Git log stderr: ${stderr}`);
                  panel.webview.postMessage({ command: "gitLogResponse", payload: [], error: `Failed to get git log: ${stderr || error.message}` });
                  return;
                }
                if (stderr) {
                  console.warn(`[IntelliGit] Git log stderr (non-fatal): `, stderr);
                }
                console.log(`[IntelliGit] Git log stdout raw length: ${stdout.length}`);
                const charCodes = stdout.split("").map((c) => c.charCodeAt(0));
                console.log("[IntelliGit] Raw stdout char codes (first 350):", charCodes.slice(0, 350).join(", "));
                if (charCodes.length > 350) {
                  console.log("[IntelliGit] (stdout has more char codes...)");
                }
                try {
                  const commitRecords = stdout.trimEnd().split("\0");
                  console.log(`[IntelliGit] Number of commit records (split by NUL): ${commitRecords.length}`);
                  if (commitRecords.length > 0 && commitRecords[commitRecords.length - 1] === "") {
                    commitRecords.pop();
                    console.log(`[IntelliGit] Number of commit records after pop: ${commitRecords.length}`);
                  }
                  console.log("[IntelliGit] Content of commitRecords (first 5):", JSON.stringify(commitRecords.slice(0, 5), null, 2));
                  const commits = commitRecords.map((record) => {
                    const fields = record.split(fieldSeparator);
                    return {
                      hash: fields[0] || "",
                      authorName: fields[1] || "",
                      authorEmail: fields[2] || "",
                      date: fields[3] || "",
                      subject: fields[4] || "",
                      body: fields[5] || "",
                      parents: fields[6] ? fields[6].split(" ").filter((p) => p) : [],
                      refs: fields[7] || ""
                    };
                  }).filter((commit) => commit.hash);
                  console.log("[IntelliGit] Parsed commits count:", commits.length);
                  if (commits.length > 0) {
                    console.log("[IntelliGit] First parsed commit:", JSON.stringify(commits[0], null, 2));
                  }
                  panel.webview.postMessage({ command: "gitLogResponse", payload: commits });
                } catch (parseError) {
                  console.error("[IntelliGit] Error parsing git log output:", parseError);
                  panel.webview.postMessage({ command: "gitLogResponse", payload: [], error: `Error parsing git log: ${parseError.message}` });
                }
              });
              return;
          }
        },
        void 0,
        context.subscriptions
      );
      panel.onDidDispose(
        () => {
          console.log("[IntelliGit] Panel disposed.");
        },
        null,
        context.subscriptions
      );
    });
    context.subscriptions.push(disposable);
    console.log('[IntelliGit] Command "intelligit.showPanel" registration successful.');
  } catch (error) {
    console.error("[IntelliGit] Error during command registration:", error);
    vscode.window.showErrorMessage("IntelliGit failed to activate. Check logs.");
  }
  console.log("[IntelliGit] Activation complete.");
}
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
function getWebviewContent(webview, extensionUri, appUrl) {
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
function deactivate() {
  console.log("[IntelliGit] Deactivating extension.");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
