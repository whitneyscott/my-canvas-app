# Lessons Learned

## Two Developer Keys Required (Critical)

You need **two** separate Developer Keys in Canvas:

| Key Type | Purpose | .env Variables | Scope Enforcement |
|----------|---------|----------------|-------------------|
| **LTI Key** | LTI 1.3 launch (login, launch, JWKS) | `LTI_CLIENT_ID` | Enforced—causes `invalid_scope` if used for OAuth |
| **API Key** | OAuth to get Canvas API token | `CANVAS_OAUTH_CLIENT_ID`, `CANVAS_OAUTH_CLIENT_SECRET` | Off by default—required for OAuth flow |

Create the **API Key** via Admin → Developer Keys → Add Developer Key → **Add API Key** (not LTI Key). Turn off "Enforce Scopes" on the API key. Add redirect URI `{APP_URL}/oauth/canvas/callback`. Put its Client ID and Secret in `.env`.

After changing `.env`, **restart the NestJS server** (not Canvas). The app loads env at startup.

## Canvas Setup

- Use a stable branch (`git checkout stable/YYYY-MM-DD`), not master.
- Run `sudo chmod -R 777 ~/canvas` before setup to prevent permission errors.
- Canvas must be on the Linux filesystem (`~/canvas`), never on `/mnt/c/`.
- Add `ports: - "80:80"` to the web service in `docker-compose.override.yml` or the browser can't reach Canvas.

## LTI 1.3 Developer Key

- `scopes` must be an array `[]`, not an empty string `""`.
- Client ID (e.g. `10000000000003`) is the Developer Key ID—it never changes.
- Installing "By Client ID" creates a new deployment; that's normal.
- Don't hardcode `client_id` validation in the app—Canvas generates new IDs per installation.
- Two redirect URIs are required:
  1. LTI launch: `{APP_URL}/lti/launch`
  2. OAuth callback: `{APP_URL}/oauth/canvas/callback`
- See "Two Developer Keys Required" above—LTI Key for launch, API Key for OAuth.

## LTI 1.3 Architecture

- Keep Canvas and the app in the same environment—both local or both deployed. Mixing them causes the app to fetch unreachable URLs (e.g. Render trying to hit `http://localhost`).
- `iss` comes from Canvas's configured domain (`lti_iss` in `config/security.yml`), not from the launch JSON.
- Deployment ID is dynamic—never hardcode it.
- Test LTI tools locally first (`localhost:3000`), then migrate URLs to production.

## Canvas Open Source Config

- `lti_iss` in `config/security.yml` sets the issuer; default is `https://canvas.instructure.com`. Override for self-hosted (e.g. `http://localhost`).
- Restart after changes: `docker-compose restart web`.

## Development Workflow

- Never put Node.js projects in OneDrive—move to `C:\Dev\` first.
- Changing `.env`? Restart **NestJS** (`npm run start:dev`), not Canvas.
- Build locally and confirm success before pushing to Render.
- Test locally before deploying—local Canvas can't reach the public internet.
- Git must be configured on a new machine before syncing.

## APP_URL

- Project configured for localhost: `http://localhost:3000`. Production: `https://canvas-bulk-editor.onrender.com`.

## Debug Log

- Available at `/lti/debug`. Shows login, launch, and OAuth steps.
- Shareable URL lets others (or tools) inspect it directly instead of copying logs—saves time and reduces mistakes.
