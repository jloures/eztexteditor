# EzTextEditor

A **secure, client-side, multi-tab Markdown editor** that stores 100% of your data in the URL. accessible anywhere, no database required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

-   **🔒 100% Client-Side Encryption**: Your data never leaves your browser. Content is encrypted using `AES-GCM` and stored in the URL fragment.
-   **📑 Multi-Tab Interface**: Manage multiple notes in a single workspace with a sleek, collapsible sidebar.
-   **⚡ Live Preview**: Instant Markdown rendering as you type.
-   **🎨 Modern UI**: Clean, distraction-free interface with Dark/Light mode support.
-   **🔗 Shareable Links**: Generate secure, shareable links containing your entire notebook state.
-   **📂 Portable**: Download your entire notebook as a secure `.zip` backup or copy raw text instantly.
-   **No Setup Required**: Just open `index.html` and start writing.

## 🚀 How It Works

This editor is stateless. It does not use a backend database or local storage for the document content.

1.  **Write**: Type your markdown in the editor.
2.  **Compress & Encrypt**: The app compresses your workspace state (all tabs) and, if enabled, encrypts it with a password.
3.  **Store in URL**: The resulting data string is placed in the URL hash (`#...`).
4.  **Save/Share**: Bookmark the URL or share it. When you open it again, the app decrypts the hash and restores your exact workspace.

## 🛠️ Usage

### Quick Start
Simply open `index.html` in any modern web browser.

### Key Commands
-   **New Note**: Click `+ New Note` in the sidebar.
-   **Rename Note**: Double-click a tab or click the pencil icon to rename.
-   **Encrypt**: Click the **Unlock** icon in the toolbar to set a password.
-   **Preview**: Toggle the **Eye** icon to switch between Edit and Preview modes.
-   **Export**: Click the **Download** icon to save your entire workspace as a `.zip` file containing a secure restoration script.

## 📦 Installation

Since this is a static single-page application, no installation is needed.

```bash
git clone https://github.com/jloures/eztexteditor.git
cd eztexteditor
open index.html
```

## 🚀 Deployment

This app can be deployed to any static site hosting service.

### GitHub Pages
1. Go to your repository **Settings** > **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select the `main` branch and `/ (root)` folder.
4. Click **Save**.

### Netlify
1. Connect your repository to [Netlify](https://www.netlify.com/).
2. Netlify will automatically detect the `index.html` and deploy it.
3. (Optional) Set up a custom domain in the Netlify dashboard.

### Vercel
1. Import your repository to [Vercel](https://vercel.com/).
2. Click **Deploy**.

## 🔒 Security

-   **Encryption**: Uses `PBKDF2` for key derivation and `AES-GCM` (256-bit) for encryption.
-   **Zero-Knowledge**: Since there is no backend, we (the developers) cannot see your data or your passwords. If you lose your password, **your data cannot be recovered**.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
