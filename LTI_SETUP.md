# LTI 1.3 Setup for Canvas Bulk Editor

## Prerequisites

- Canvas instance with Admin access (Developer Keys)
- Local: Canvas and app both on localhost. Production: App deployed with HTTPS (required for LTI)

## 1. Generate RSA Key Pair

```bash
node scripts/generate-secrets.js
```

This creates `private-key.pem` and `public-key.pem`. Keep the private key secret.

## 2. Configure Canvas Developer Key (LTI 1.3)

1. In Canvas: Admin > Developer Keys > + Developer Key > + LTI Key
2. Set:
   - **Key Name**: Canvas Bulk Editor
   - **Redirect URI**: `http://localhost:3000/lti/launch` (production: `https://your-app-url.com/lti/launch`)
   - **Login URL**: `http://localhost:3000/lti/login` (production: `https://your-app-url.com/lti/login`)
   - **JWK Method**: Public JWK
   - **Public JWK Set URL**: `http://localhost:3000/lti/jwks` (production: `https://your-app-url.com/lti/jwks`)
3. Save and note the **Client ID**.

## 3. Configure OAuth 2.0 (for Canvas API access)

**Use a separate API Developer Key**—LTI keys have scope enforcement that causes `invalid_scope` for OAuth. API keys have it disabled by default.

1. In Canvas: Admin > Developer Keys > + Developer Key > **+ API Key** (not LTI Key)
2. Key name: e.g. "Canvas Bulk Editor OAuth"
3. Add Redirect URI: `http://localhost:3000/oauth/canvas/callback` (production: `https://your-app-url.com/oauth/canvas/callback`)
4. Save, enable the key, and note the **Client ID** and **Client Secret**

## 4. Environment Variables

Create a `.env` file in the project root.

```env
SESSION_SECRET=<random-secret>
APP_URL=http://localhost:3000
LTI_CLIENT_ID=<from-step-2>
LTI_PRIVATE_KEY_PATH=private-key.pem
LTI_KEY_ID=default
CANVAS_OAUTH_CLIENT_ID=<from-step-3>
CANVAS_OAUTH_CLIENT_SECRET=<from-step-3>
```

- **LTI_CLIENT_ID**: From the LTI Developer Key (step 2); used to validate OIDC login.
- **CANVAS_OAUTH_CLIENT_ID** and **CANVAS_OAUTH_CLIENT_SECRET**: From the API Developer Key (step 3). Required for OAuth—avoids `invalid_scope` from LTI keys.
- **CANVAS_OAUTH_CLIENT_SECRETS** (optional): JSON map for multiple keys/instances.

## 5. Install LTI Tool in Canvas

1. Create or edit an External Tool (LTI 1.3)
2. Use the Client ID from step 2
3. Add the tool to your course(s).

## 6. LTI 1.1 (XML / legacy external tool) on the same `/lti/launch` URL

Canvas can POST an **OAuth 1.0a** launch (consumer key + signature) to the same `POST /lti/launch` route. The app verifies the signature with a **shared secret** from the environment (the secret is **not** in the XML).

Add to `.env` / Render:

```env
LTI11_SHARED_SECRET=<paste Shared Secret from the Canvas external tool>
```

Optional:

- `LTI11_CONSUMER_KEY` — if set, must match `oauth_consumer_key` from Canvas (e.g. same value as in your XML `consumer_key`).
- `LTI11_SECRETS_JSON` — JSON map of consumer key to secret if you run multiple 1.1 tools, e.g. `{"Canvas_Bulk_Edit_123":"secret-here"}` (when set, keys in the map take precedence over `LTI11_SHARED_SECRET`).

After a valid 1.1 launch, the flow matches 1.3 for API access: session is set, then **Canvas OAuth** (`/oauth/canvas`) runs using your **API Developer Key** (`CANVAS_OAUTH_*`).

### Troubleshooting: “No LTI 1.1 shared secret found” on Render

1. **Env key names (any one):** `LTI11_SHARED_SECRET` (preferred), `LTI_1_1_SHARED_SECRET`, `LTI1_SHARED_SECRET`, or `LTI_SHARED_SECRET`.
2. **Same service:** The variable must be on the **production Web Service** that serves `canvas-bulk-editor…` (not only a database or a preview instance).
3. **`LTI11_SECRETS_JSON`:** If this env var is set at all, it must be valid JSON **and** include an entry whose key exactly matches **`oauth_consumer_key`** from Canvas (e.g. `{"Canvas_Bulk_Edit_123":"your-secret"}`). An empty `{}` or missing key will fail; either fix the JSON or **delete** `LTI11_SECRETS_JSON` and use only `LTI11_SHARED_SECRET`.
4. **Redeploy** after changing env vars so the running process picks them up.

## Local Development

- Set `APP_URL=http://localhost:3000` in `.env`
- Canvas and the app must both run locally (see [LESSONS_LEARNED.md](LESSONS_LEARNED.md))
- Use `http://localhost:3000/lti/launch`, `http://localhost:3000/oauth/canvas/callback` in the Developer Key

## Flow

1. User opens the tool from Canvas → LTI 1.3 launch (id_token verified)
2. App stores course context and Canvas domain; redirects to app
3. User sees "Authorize with Canvas" → OAuth 2.0 flow
4. OAuth callback stores access token in session
5. All course data is loaded via the user's token (`/users/self/courses`)
