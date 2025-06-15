# IntelliGit Task Manager & Collaborative Refactoring Tool

IntelliGit is a comprehensive solution designed to enhance developer productivity and collaboration. It combines a web-based task management board with a powerful VS Code extension, enabling seamless task tracking, real-time notifications, and AI-assisted collaborative code refactoring.

## Features

*   **Integrated Task Management**: A Kanban-style board (To Do, In Progress, Done) to manage project tasks, accessible via a React-based webview in VS Code.
*   **Real-time Task Synchronization**: Tasks are synced with Firebase (Firestore) for persistence and real-time updates across users.
*   **Drag-and-Drop Interface**: Easily move tasks between columns.
*   **Task Assignment & Notifications**:
    *   Assign tasks to contributors.
    *   Receive VS Code notifications when a task is assigned or its status changes.
    *   Receive email notifications (customizable HTML template) for task assignments.
*   **VS Code Extension**:
    *   Provides the webview for the task board.
    *   Handles background processes like notifications and Firebase communication.
    *   Integrates with the Genkit AI framework for features like collaborative refactoring.
*   **Collaborative Refactoring**: Leverage AI (via Genkit and Gemini) to suggest and apply code refactorings.
*   **Contributor Management**: Fetches contributor information, including GitHub avatars and emails (if public).
*   **Secure Credential Management**: Uses `.env` files for sensitive information like API keys and SMTP credentials.

## Tech Stack

*   **Frontend (Webview)**: Next.js, React, TypeScript, Tailwind CSS
*   **State Management (Frontend)**: React Hooks & Context API
*   **Drag & Drop**: `@dnd-kit/core`
*   **VS Code Extension**: TypeScript, VS Code API, `nodemailer` (for emails)
*   **Backend/Database**: Firebase (Firestore for tasks, potentially Firebase Auth)
*   **AI Integration**: Genkit, Google Gemini
*   **Build Tools**: esbuild (for extension), Next.js build tools
*   **Testing**: Vitest (for webapp), VS Code Test Runner (for extension)
*   **Environment Management**: `dotenv`

## Project Structure

```
.
├── intelligit/               # VS Code Extension
│   ├── src/
│   │   ├── extension.ts      # Main extension activation logic
│   │   ├── emailTemplate.html # Template for email notifications
│   │   └── test/             # Extension tests
│   ├── config/
│   │   └── firebaseServiceAccountKey.json # Placeholder for Firebase Admin SDK key
│   ├── package.json          # Extension dependencies and scripts
│   └── .env                  # Environment variables for the extension (SMTP, Firebase path)
│
├── src/                      # Next.js Web Application (Webview UI)
│   ├── app/                  # Next.js App Router (pages, layout, API routes)
│   │   ├── api/
│   │   │   └── refactor/     # API for AI refactoring
│   │   └── page.tsx          # Main page hosting the webview content
│   ├── components/           # React components (tasks-board, dialogs, UI elements)
│   ├── contexts/             # React contexts (e.g., AuthContext)
│   ├── firebase/             # Firebase client-side configuration
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions, AI model interactions
│   └── types/                # TypeScript type definitions
│
├── package.json              # Web application dependencies and scripts
├── tsconfig.json             # TypeScript configuration for webapp
├── next.config.ts            # Next.js configuration
├── vitest.config.ts          # Vitest configuration
└── README.md                 # This file
```

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended, e.g., v18 or v20)
*   [npm](https://www.npmjs.com/) (v8+) or [yarn](https://yarnpkg.com/) (v1.22+)
*   [Visual Studio Code](https://code.visualstudio.com/)

## Setup and Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/n4bi10p/intelligit
    cd intelligit
    ```

2.  **Web Application (Root Directory)**:
    *   You should now be in the project root directory (`intelligit/`).
    *   **Install Dependencies**:
        ```bash
        npm install
        # or
        yarn install
        ```
    *   **Firebase Client-Side Setup**:
        1.  Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
        2.  Add a Web App to your Firebase project.
        3.  Copy the Firebase configuration object (apiKey, authDomain, projectId, etc.).
        4.  Create a `.env.local` file in the root directory (`intelligit/.env.local`).
        5.  Add your Firebase client configuration to `.env.local` using `NEXT_PUBLIC_` prefixes:
            ```env
            NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
            NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
            NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
            ```
        6.  Ensure `src/firebase/firebase.ts` is correctly using these environment variables.

3.  **VS Code Extension (`intelligit/intelligit/` Directory)**:
    *   Navigate to the extension directory from the project root:
        ```bash
        cd intelligit
        ```
    *   **Install Dependencies**:
        ```bash
        npm install
        # or
        yarn install
        ```
    *   **Firebase Admin SDK Setup**:
        1.  In the Firebase Console, go to "Project settings" > "Service accounts".
        2.  Generate a new private key and download the JSON file.
        3.  Place this JSON file in the `intelligit/intelligit/config/` directory (i.e., `config/` within the extension's own folder).
            **Important**: Ensure this file is NOT committed to Git if it contains sensitive credentials. Add `intelligit/config/firebaseServiceAccountKey.json` to your `.gitignore` file in the extension's directory if it's not already there.
    *   **Environment Variables for Extension**:
        1.  Create a `.env` file in the `intelligit/intelligit/` directory (i.e., `intelligit/.env`).
        2.  Add the following environment variables, replacing placeholder values with your actual credentials:
            ```env
            # SMTP Configuration for Email Notifications
            SMTP_HOST="your-smtp-host"
            SMTP_PORT="your-smtp-port" # e.g., 587 for TLS, 465 for SSL
            SMTP_USER="your-smtp-username"
            SMTP_PASS="your-smtp-password"
            SMTP_FROM_EMAIL="notifications@example.com" # Email address to send from

            # Firebase Admin SDK Configuration
            FIREBASE_SERVICE_ACCOUNT_PATH="./config/firebaseServiceAccountKey.json" 
            ```
        3.  Ensure `intelligit/intelligit/.env` is listed in the `.gitignore` file located in the `intelligit/intelligit/` directory.

## Running the Application

1.  **Web Application (for UI development/testing outside VS Code, if applicable)**:
    *   From the root directory (`intelligit/`):
        ```bash
        npm run dev
        # or
        yarn dev
        ```
    *   Open your browser to `http://localhost:3000` (or the port specified).

2.  **VS Code Extension (Primary Mode of Operation)**:
    *   Open the project root folder (`intelligit/`) in VS Code.
    *   **Launch the Extension**:
        *   Press `F5` or go to "Run" > "Start Debugging". This will open a new VS Code window (Extension Development Host) with the `intelligit` extension running.
        (Ensure your VS Code launch configuration in `.vscode/launch.json` at the project root correctly points to the extension if you have multiple launch configs).
    *   **Accessing the Task Board**:
        *   Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
        *   Run the command that activates the webview (e.g., "IntelliGit: Show Tasks Board" - check `intelligit/intelligit/package.json` for the exact command title).

## Building for Production

1.  **Web Application**:
    *   From the root directory (`intelligit/`):
        ```bash
        npm run build
        # or
        yarn build
        ```
    *   This will create an optimized build in the `.next/` folder.

2.  **VS Code Extension**:
    *   Navigate to the extension's directory (`intelligit/intelligit/`):
        ```bash
        cd intelligit
        ```
    *   **Compile the Extension**:
        ```bash
        npm run vscode:prepublish 
        # This script typically runs: esbuild ./src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node --minify
        ```
    *   **Package the Extension (Optional, for distribution)**:
        *   Install `vsce` globally if you haven't already: `npm install -g @vscode/vsce`
        *   Run packaging command (from within `intelligit/intelligit/`):
            ```bash
            vsce package
            ```
        *   This will create a `.vsix` file which can be installed into VS Code.

## Testing

1.  **Web Application (Vitest)**:
    *   From the root directory (`intelligit/`):
        ```bash
        npm test
        # or
        yarn test
        ```
    *   This will run tests defined in files like `src/components/__tests__/code-chat.test.tsx` using Vitest.

2.  **VS Code Extension**:
    *   Navigate to the extension's directory (`intelligit/intelligit/`):
        ```bash
        cd intelligit
        ```
    *   The `package.json` in this directory includes a test script: `"test": "vscode-test"`.
    *   To run tests (e.g., `intelligit/intelligit/src/test/extension.test.ts`):
        *   You might need to configure a test runner or launch configuration in VS Code specifically for extension tests.
        *   Typically, you can run `npm test` from the `intelligit/intelligit/` directory:
            ```bash
            npm test
            ```
        *   Alternatively, VS Code's Test Explorer UI might pick up and run these tests if correctly configured.

## Key Components & Logic

*   **`src/components/tasks-board.tsx`**: The core React component for the Kanban board UI, handling drag-and-drop, task rendering, and communication with the VS Code extension.
*   **`intelligit/src/extension.ts`**: The entry point for the VS Code extension. It handles:
    *   Activation and registration of commands.
    *   Creation and management of the webview panel.
    *   Message handling between the webview and the extension.
    *   Firebase Admin SDK initialization and task synchronization.
    *   Email notifications using `nodemailer`.
    *   Loading environment variables using `dotenv`.
*   **`src/app/api/refactor/route.ts`**: Next.js API route for handling AI-powered code refactoring requests, likely interacting with Genkit.
*   **Firebase Integration**:
    *   Client-side (webapp): `src/firebase/firebase.ts` for initializing Firebase and interacting with services like Firestore for the UI.
    *   Server-side (extension): `intelligit/src/extension.ts` uses the Firebase Admin SDK for privileged operations like writing task data securely.
*   **State & Data Flow**:
    *   Tasks are primarily managed within the `TasksBoard` component's state.
    *   Changes to tasks (add, edit, delete, move) trigger messages to the extension.
    *   The extension saves task data to Firebase.
    *   The extension loads tasks from Firebase when the webview is initialized.

---

This README provides a comprehensive guide. Remember to replace placeholder values (like Api keys, Firebase configs, SMTP details) with your actual project information.
