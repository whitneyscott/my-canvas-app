# LTI 1.3 Setup for Canvas Bulk Editor

## Prerequisites

- Canvas instance with Admin access (Developer Keys)
- App deployed with HTTPS (required for LTI)

## 1. Generate RSA Key Pair

```bash
node scripts/generate-secrets.js
```

This creates `private-key.pem` and `public-key.pem`. Keep the private key secret.

## 2. Configure Canvas Developer Key (LTI 1.3)

1. In Canvas: Admin > Developer Keys > + Developer Key > + LTI Key
2. Set:
   - **Key Name**: Canvas Bulk Editor
   - **Redirect URI**: `https://your-app-url.com/lti/launch`
   - **Login URL**: `https://your-app-url.com/lti/login`
   - **JWK Method**: Public JWK
   - **Public JWK Set URL**: `https://your-app-url.com/lti/jwks`
3. Save and note the **Client ID**.

## 3. Configure OAuth 2.0 (for Canvas API access)

The same Developer Key can be used for OAuth, or create a separate one:

1. In Canvas: Admin > Developer Keys > create or use existing
2. Add Redirect URI: `https://your-app-url.com/oauth/canvas/callback`
3. Enable the key and note Client ID and Secret.

## 4. Environment Variables

The app uses the client_id from the LTI launch (the Developer Key used for the installation) for OAuth, so it works regardless of which installation or Canvas instance is used.

```env
SESSION_SECRET=<random-secret>
APP_URL=https://your-app-url.com
LTI_CLIENT_ID=<from-step-2>
LTI_PRIVATE_KEY_PATH=private-key.pem
LTI_KEY_ID=default
CANVAS_OAUTH_CLIENT_SECRET=<developer-key-secret>
```

- **LTI_CLIENT_ID**: Used to validate the OIDC login; must match your Developer Key.
- **CANVAS_OAUTH_CLIENT_SECRET**: Secret for the Developer Key used for OAuth.
- **CANVAS_OAUTH_CLIENT_ID** (optional): Fallback if client_id isn't in the launch.
- **CANVAS_OAUTH_CLIENT_SECRETS** (optional): JSON map for multiple Canvas instances, e.g. `{"client_id_1":"secret1","client_id_2":"secret2"}`.

## 5. Install LTI Tool in Canvas

1. Create or edit an External Tool (LTI 1.3)
2. Use the Client ID from step 2
3. Add the tool to your course(s).

## Flow

1. User opens the tool from Canvas → LTI 1.3 launch (id_token verified)
2. App stores course context and Canvas domain; redirects to app
3. User sees "Authorize with Canvas" → OAuth 2.0 flow
4. OAuth callback stores access token in session
5. All course data is loaded via the user's token (`/users/self/courses`)
