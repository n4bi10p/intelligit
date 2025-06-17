# IntelliGit: AI-Powered Git Collaboration for VS Code

IntelliGit is a Visual Studio Code extension that brings AI-powered Git workflows directly into your editor. With seamless integration of Google Gemini 1.5 Pro, you can generate changelogs, professional README files, automate pull requests, and get smart code refactoring—all from a beautiful, modern UI.

---

## Features

- **AI Changelog Generator**
  - Groups recent commits by type (feat, fix, chore, docs, refactor, others)
  - Uses Gemini 1.5 Pro to generate release note summaries
  - Markdown preview, in-place editing, copy, and one-click save as `CHANGELOG.md`

- **README.md Generator**
  - Analyzes your project’s `package.json`, codebase, and languages
  - Uses Gemini 1.5 Pro to create a professional, markdown-formatted README
  - Markdown preview, edit, copy, and save as `README.md`

- **AI Refactor & Commit Assistant**
  - Get AI-powered code refactoring suggestions
  - Summarize diffs into conventional commit messages
  - Stage, commit, and push—all from the UI

- **Pull Request Automation**
  - Generate PR titles and bodies with AI
  - List, merge, and close PRs
  - AI-powered PR review feedback

- **Git Status Helper**
  - Explains your current Git status and suggests next actions

- **Secure & Workspace-Aware**
  - All Git commands run in your active workspace repo
  - Never exposes secrets or raw errors to users

---

## Project Structure

```
.
├── src/
│   ├── app/
│   │   └── api/           # Backend API endpoints (Next.js API routes)
│   ├── components/        # React UI components (dropdowns, dialogs, panels)
│   ├── ai/                # AI prompt logic and flows
│   ├── lib/               # Utility functions (Git, PR, etc.)
│   └── types/             # TypeScript types
├── intelligit/
│   └── src/extension.ts   # VS Code extension entry point
├── package.json
├── README.md
├── LICENSE
└── .env.local             # Environment variables (not committed)
```

---

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/n4bi10p/intelligit.git
   cd intelligit
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` and fill in your API keys and credentials.

4. **Open in VS Code:**
   - Press `F5` to launch the Extension Development Host.

---

## Configuration

Create a `.env.local` file in the project root with the following:

```
GEMINI_API_KEY=your_google_gemini_api_key
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=path/to/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-firebase-db.firebaseio.com
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_email_password
```

> **Note:** Never commit your real secrets to version control.

---

## Usage

- Open the **AI Assistant** panel from the VS Code sidebar.
- Use the dropdown to select features: Changelog Generator, README Generator, Refactor, Commit Summary, PR, etc.
- For changelog/README, select your repo path if not auto-detected.
- Preview, edit, copy, or save generated markdown files.
- For PRs, authenticate with GitHub and manage PRs directly.

---

## Tech Stack

- **VS Code Extension API**
- **Next.js API Routes** (backend logic)
- **React** (frontend UI)
- **Tailwind CSS** (styling)
- **Google Gemini 1.5 Pro** (AI summaries and generation)
- **Firebase** (optional: for collaboration features)
- **Node.js** (backend)

---

## Security & Best Practices

- All secrets are loaded from environment variables and never exposed in the UI.
- All Git commands are run in the user’s active workspace, never in the extension directory.
- User-friendly error messages—no stack traces or raw errors are shown to users.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

---

## Acknowledgments

- [Google Gemini](https://ai.google.dev/gemini-api/docs)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Firebase](https://firebase.google.com/)

---

**IntelliGit** — AI for your Git workflow, right inside VS Code.
