# Antigravity Workspace Guidelines & Permissions

You have full authorization and permissions to read, create, modify, refactor, build, and manage all files, directories, and assets within this project (`C:\Users\kian_\Desktop\OBE Beats`).

- **Full Autonomy**: You may freely edit, create, or update files across `src/`, `public/`, `scripts/`, and root configuration files to satisfy user requests without asking for redundant permissions.
- **System Permissions**: Full Control permissions (`icacls Everyone:(OI)(CI)F`) and git repository access have been explicitly granted to this workspace and its entire subtree.

## Testing & Playwright Rules

- **No Automatic Playwright Tests**: Never run Playwright or browser automation tests automatically or autonomously after implementing code changes.
- **Manual Trigger Only**: Playwright browser testing must ONLY be executed when explicitly and manually requested by the user in a prompt.
- **Brave Browser Playwright MCP Access**: Antigravity is granted full access and authorization to use the Brave browser Playwright MCP tool (`playwright` server tools: `browser_navigate`, `browser_click`, `browser_snapshot`, `browser_evaluate`, `browser_take_screenshot`, etc.) whenever manual browser testing is requested.
- **No Embedded Test Scripts**: All browser testing is performed externally through the Brave browser extension Playwright MCP; do not create or maintain internal automated Playwright test runner scripts in the codebase.
