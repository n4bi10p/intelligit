"use client"; // This is a client component

import React, { useEffect, useState, useCallback } from 'react';

interface VsCodeMessage {
    command: string;
    payload?: any;
    text?: string; // For existing helloFromWebview
    error?: string; // To handle errors from extension
}

export interface Commit {
    hash: string;
    authorName: string;
    authorEmail: string;
    date: string;
    subject: string;
    body?: string;
    parents?: string;
    refs?: string;
}

// Define a type for the vscodeApi prop
interface VsCodeApi {
    postMessage: (message: any) => void;
}

interface WebviewMessengerProps {
    onGitLogDataReceived: (commits: Commit[], error: string | null) => void;
    repositoryConnected: boolean;
    vscodeApi: VsCodeApi; // Ensure this line is present and correct
}

const WebviewMessenger: React.FC<WebviewMessengerProps> = ({ onGitLogDataReceived, repositoryConnected, vscodeApi }) => {
    const [testResponse, setTestResponse] = useState<string>(''); // For the test button

    const sendMessageToExtension = useCallback((message: VsCodeMessage) => {
        console.log('[IntelliGit-UI] Sending message to parent (extension host):', message);
        window.parent.postMessage(message, '*'); // '*' is okay for local dev, be more specific for production
    }, []);

    useEffect(() => {
        // Use the passed vscodeApi prop
        if (vscodeApi && !repositoryConnected) {
            console.log('[IntelliGit-WebviewMessenger] Requesting initial git log via vscodeApi prop.');
            vscodeApi.postMessage({ command: 'getGitLog' });
        }
    }, [repositoryConnected, vscodeApi]); // Add vscodeApi to dependencies

    useEffect(() => {
        // Send a message to get the git log when the component mounts
        sendMessageToExtension({ command: 'getGitLog' });

        const handleMessage = (event: MessageEvent<VsCodeMessage>) => {
            const message = event.data;
            console.log('[IntelliGit-UI] Message received from parent (extension host or relay):', message);

            // It's good practice to check the origin of the message for security
            if (event.origin.startsWith('vscode-webview://')) { // Ensure message is from our webview host
                switch (message.command) {
                    case 'responseFromExtension': // This is for the test "hello" message
                        // Ensure payload is a string or handle appropriately
                        if (typeof message.payload === 'string') {
                            setTestResponse(message.payload);
                        } else if (message.payload && typeof message.payload === 'object') {
                            setTestResponse(JSON.stringify(message.payload));
                        } else {
                            setTestResponse('Received non-string payload for responseFromExtension');
                        }
                        break;
                    case 'gitLogResponse':
                        console.log('[IntelliGit-UI] Received gitLogResponse:', message.payload, 'Error:', message.error);
                        if (message.error) {
                            onGitLogDataReceived([], message.error);
                        } else {
                            onGitLogDataReceived(message.payload as Commit[] || [], undefined);
                        }
                        break;
                    default:
                        console.log('[IntelliGit-UI] Unknown command received:', message.command);
                }
            } else {
                // console.warn('[IntelliGit-UI] Ignoring message from unexpected origin:', event.origin, message);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [sendMessageToExtension, onGitLogDataReceived]);

    const handleSendHelloTest = () => {
        sendMessageToExtension({ command: 'helloFromWebview', text: 'Test message from UI' });
    };

    // This component is mostly for communication, so its UI can be minimal or hidden.
    // The button below is just for testing the basic message roundtrip.
    return (
        <div style={{ display: 'none' }}> {/* Hidden as it's a background worker */}
            <button onClick={handleSendHelloTest}>Test Send Hello</button>
            {testResponse && <p>Test Response: {testResponse}</p>}
        </div>
    );
};

export default WebviewMessenger;
