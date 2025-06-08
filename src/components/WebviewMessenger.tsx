"use client"; // This is a client component

import React, { useEffect, useState } from 'react';

const WebviewMessenger = () => {
    const [messageFromExtension, setMessageFromExtension] = useState<string>('');

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Ensure the message is from a trusted source (e.g., the extension's webview host)
            // For simplicity, we'll check if it has a command. In a real app, validate event.origin.
            const message = event.data;
            if (message && message.command) {
                console.log('[Webview] Message received from extension host:', message);
                switch (message.command) {
                    case 'responseFromExtension':
                        setMessageFromExtension(message.payload);
                        break;
                }
            } else {
                // console.log('[Webview] Ignoring message from unknown source or malformed message:', event);
            }
        };

        window.addEventListener('message', handleMessage);

        // Cleanup listener when component unmounts
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const handleSendMessageToExtension = () => {
        // Post the message to the parent window (the webview host page).
        // The relay script in the parent window will forward it to the extension.
        // '*' as targetOrigin is permissive; in production, you might restrict it.
        // The relay script in extension.ts should validate the origin of messages it receives from the iframe.
        window.parent.postMessage({
            command: 'helloFromWebview',
            text: 'Hello from the Next.js UI!'
        }, '*'); 
        console.log('[Webview] Message sent to parent window (extension host).');
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
            <h3>Webview Messenger Test</h3>
            <button onClick={handleSendMessageToExtension} style={{ padding: '10px', marginRight: '10px' }}>
                Send Message to Extension
            </button>
            {messageFromExtension && (
                <p style={{ marginTop: '10px', color: 'blue', border: '1px dashed blue', padding: '10px' }}>
                    <strong>Response from extension:</strong> {messageFromExtension}
                </p>
            )}
        </div>
    );
};

export default WebviewMessenger;
