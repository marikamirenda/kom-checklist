# KOM Checklist (Mock-up)

Static web mock-up for a Project Kick-Off Meeting internal checklist.

## Features
- Checklist rendered from `checklist.json`
- Checkboxes saved in browser `localStorage`
- Per-item button: `Richiedi` (enabled only if the item is NOT flagged)
- Global button: `Richiedi mancanti` (bulk request with all unchecked items)
- Export current state as JSON

## No integrations (yet)
`dispatchRequest(payload)` currently prints to console.
Later, it can POST to a Power Automate HTTP trigger to:
- send a Teams message (channel/chat)
- and/or send an Outlook email
- and/or create a Planner task

## Run locally
Option A (simple): open `index.html` with a local server.

### Using VS Code
Install "Live Server" extension and run "Open with Live Server".

### Using Python
From the repo folder:
- `python -m http.server 5500`
Then open:
- http://localhost:5500

## Deploy on GitHub Pages
1. Push repo to GitHub
2. Go to Settings -> Pages
3. Source: Deploy from a branch
4. Branch: main / root
5. Save

You will get an URL like:
https://<your-username>.github.io/<repo-name>/
