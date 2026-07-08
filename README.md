# Groq Terminal Chat

A minimal, terminal-styled chat UI that streams responses from the **Groq API** directly in the browser — no backend required. Built with React + Vite.

## How it works

- You paste your own Groq API key into the settings panel (stored only in browser session state — never persisted or sent anywhere except `api.groq.com`).
- Messages are sent straight from the client to Groq's `chat/completions` endpoint with `stream: true`.
- The response is streamed token-by-token using the Fetch API's `ReadableStream`, parsed as Server-Sent Events, and rendered live as the assistant "types."
- Model used: `llama-3.3-70b-versatile`.

## Project structure

```
.
├── index.html        # Vite entry HTML, loads /src/main.jsx
├── src/
│   ├── main.jsx        # React root, mounts <App />
│   ├── App.jsx          # Chat UI + Groq streaming logic
│   └── index.css        # Terminal-style dark theme for the chat UI
├── App.css             # Unused — leftover Vite template styles (hero/next-steps), not imported by App.jsx
└── package.json         # Create/verify — see Setup
```

> Note: only component files were provided — no `package.json` — so dependencies and scripts below are inferred from the imports in the code.

## Prerequisites

- **Node.js** 18+
- A **Groq API key** — free at [console.groq.com/keys](https://console.groq.com/keys)

## Setup

1. **Scaffold the Vite project (if not already done)**

   ```bash
   npm create vite@latest . -- --template react
   ```

2. **Install dependencies**

   ```bash
   npm install
   npm install lucide-react
   ```

3. **Place the files**

   Put `App.jsx`, `index.css`, and `main.jsx` inside `src/`, and use the provided `index.html` at the project root.

   ```bash
   mkdir -p src
   mv App.jsx index.css main.jsx src/
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

5. Open the app, click the ⚙️ settings icon, paste your Groq API key, and start chatting.

## Notes & gotchas

- **No backend, no `.env`** — this app is entirely client-side. The API key lives in React state only and resets on page reload.
- **Security caveat:** because the key is entered and used client-side, anyone with browser dev tools access on that page can see it. Fine for local/personal use; not suitable for a public deployment without a backend proxy.
- `App.css` is unused dead weight from a Vite template scaffold — safe to delete unless you plan to reuse its `.hero` / `#next-steps` styles elsewhere.
- Uses [`lucide-react`](https://lucide.dev/) for icons (`Send`, `Settings`, `Terminal`, `AlertCircle`) — must be installed separately, it's not part of the default Vite React template.
- The Google Font `JetBrains Mono` is loaded via `<link>` in `index.html`; no local font files needed.
- Streaming parser buffers partial SSE lines across chunks and silently ignores malformed JSON fragments — expected behavior for `stream: true` responses, not a bug.

## Suggested `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## License

Add your license of choice here.
