# Lessons Learned

## Keep Canvas and Apps in the Same Environment

**Do not mix local and deployed.** Run Canvas and the Canvas Bulk Editor (or any LTI app) in the same environment—either both local or both online.

**Why:**
- The OIDC flow sends an issuer (iss) from Canvas to the app.
- The app fetches `{iss}/.well-known/openid-configuration` to find the OAuth auth URL.
- If Canvas is local (iss: `http://localhost`) and the app is on Render, Render’s server tries to fetch `http://localhost`—which is Render’s own host, not your machine. The request fails or returns wrong data.
- If Canvas is deployed and the app is local, the opposite mismatch can cause 401s or connection issues.
- Redirect URIs and issuer must match the actual URLs each service can reach.

---

## Other Lessons

**LTI 1.3 issuer (iss)**
- `iss` is the issuer: the URL of the Canvas instance starting the LTI flow.
- The app uses `iss` as-is to fetch OIDC discovery and build redirect URLs.
- In Canvas Open Source, `iss` is set in `config/security.yml` as `lti_iss`. Default is `https://canvas.instructure.com`; self-hosted instances must override with their own URL.

**Canvas Open Source `lti_iss`**
- File: `config/security.yml`
- Update `lti_iss` to the Canvas instance URL (e.g. `http://localhost` for local).
- Restart Canvas after changes: `docker-compose restart web`.

**Developer Key redirect URIs**
- Two different URIs are needed, both in the Developer Key:
  1. LTI launch: `{APP_URL}/lti/launch`
  2. OAuth callback: `{APP_URL}/oauth/canvas/callback`
- They serve different steps of the flow; both must be configured.

**APP_URL**
- Must be set correctly. Used for redirect URIs in OIDC and OAuth.
- Local: `http://localhost:3000`
- Production: `https://canvas-bulk-editor.onrender.com`

**Debug log**
- Available at `/lti/debug`. Shows login, launch, and OAuth steps.
- Use it to confirm `iss`, `redirectUri`, and errors without checking Render logs.
