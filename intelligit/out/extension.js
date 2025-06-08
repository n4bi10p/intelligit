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
          enableScripts: true
        }
      );
      panel.webview.html = getWebviewContent("http://localhost:9002");
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
function getWebviewContent(appUrl) {
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
function deactivate() {
  console.log("[IntelliGit] Deactivating extension.");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
