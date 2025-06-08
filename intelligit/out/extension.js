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
        (message) => {
          console.log("[IntelliGit] Message received from webview:", message);
          switch (message.command) {
            case "helloFromWebview":
              vscode.window.showInformationMessage(`Received: ${message.text}`);
              panel.webview.postMessage({
                command: "responseFromExtension",
                payload: "Hello back from the extension! (Received: " + message.text + ")"
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
function deactivate() {
  console.log("[IntelliGit] Deactivating extension.");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
