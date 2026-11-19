# Cloudflare Notify Proxy

A complete, secure, and blazing-fast proxy service for sending notifications and messages from your applications to platforms like Telegram using **Cloudflare Workers**.

This service acts as an intermediary. It allows you to securely publish messages using only a custom API Key, ensuring that your sensitive bot tokens are never exposed in your application's source code or on unsecured servers.

It can also act as a **Google OAuth intermediary**: your app asks the Worker to start sign-in / sign-up, the Worker talks to Google, and then tells your app whether the user is allowed to log in (by returning a JWT).

## Features

- 🚀 **Blazing Fast**: Runs on Cloudflare's Edge Network for instant delivery worldwide.
- 🔒 **Secure**: Authenticated via a strong, randomly generated API Key (Bearer Token).
- 👤 **Google Auth Proxy**: Worker acts as an OAuth intermediary for Google sign-in / sign-up and returns a JWT to your app.
- 🔌 **Extensible**: Designed to easily support other platforms (Discord, Slack, etc.) in the future.
- 📱 **Flexible Formatting**: Supports both simple text messages and structured, formatted crash reports.

---

## Table of Contents

1. [Quickstart: Local & Cloud Deployments](#quickstart-local--cloud-deployments)
2. [Step-by-Step Guide (Base Setup)](#step-by-step-guide)
3. [Google Auth Setup (Step-by-Step)](#google-auth-setup-step-by-step)
4. [Environment Variables Reference](#environment-variables-reference)
5. [API Usage (Telegram / Coolify)](#api-usage)
6. [Google Auth API Usage](#google-auth-api-usage)

---

## Quickstart: Local & Cloud Deployments

### Option A: Local Development with Docker (Self-Contained)

Run the entire platform (PostgreSQL, NestJS Backend, Next.js Frontend) locally with one command:

```bash
# Start all services with automated database migrations
docker compose -f docker-compose.local.yml up -d --build

# View container logs
docker compose -f docker-compose.local.yml logs -f

# Access points:
# - Frontend Dashboard: http://localhost:15434
# - Backend API:        http://localhost:15433
# - PostgreSQL:         localhost:15432
```

### Option B: Production Deployment on Coolify PaaS

For production deployment on [Coolify](https://coolify.io/):
1. Create a standalone **PostgreSQL** service in Coolify and copy its internal connection URL.
2. Deploy this repository as a **Docker Compose** service using `docker-compose.yml`.
3. Set the `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, and domain URLs in Coolify's Environment Variables.
4. Services are automatically attached to the internal `coolify` Docker network with automated database migrations on startup.

👉 For detailed, step-by-step Coolify instructions, see the **[Coolify Deployment Guide (COOLIFY.md)](COOLIFY.md)** and the **[Automated Git Push Deployment Guide (COOLIFY_AUTODEPLOY.md)](COOLIFY_AUTODEPLOY.md)**.

---

## Step-by-Step Guide

This guide will walk you through every step required to get this project up and running from scratch.

### Step 1: Create a Telegram Bot and Get Your Chat ID

Before deploying the code, you need a Telegram bot that will actually send the messages.

> If you only want Google Auth and do **not** need Telegram yet, you can skip this step and leave the Telegram variables empty for now.

1. **Create the Bot**:
   - Open Telegram and search for **[@BotFather](https://t.me/botfather)**.
   - Send the `/newbot` command.
   - Follow the instructions to give your bot a name and a unique username (ending in `bot`).
   - BotFather will give you a **Bot Token** (e.g., `123456789:ABCDEF...`). **Keep this token secret!**

2. **Get Your Chat ID**:
   - You need to tell the bot *where* to send the messages. This can be your personal chat, a group, or a channel.
   - For a personal chat, search for **[@userinfobot](https://t.me/userinfobot)** in Telegram and click Start. It will reply with your numeric `Id` (e.g., `123456789`).
   - For a group/channel, add your newly created bot to the group/channel as an admin. Then send a test message in the group. You can use a bot like `@RawDataBot` in the group to find the group's ID (group IDs usually start with a minus sign, e.g., `-100123456789`).

### Step 2: Local Project Setup

Now, let's prepare the code on your computer.

1. **Install Dependencies**:
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Generate Secure Secrets**:
   You need strong random values for `API_SECRET_KEY` and (if you use Google Auth) `JWT_SECRET`.
   Run the built-in script once per secret:
   ```bash
   npm run generate-key
   ```
   *Copy the 64-character output. Run it again if you need a second key for `JWT_SECRET`.*

3. **Create Your Local Env File**:
   Cloudflare Wrangler reads local secrets from `.dev.vars` (this file is git-ignored).
   ```bash
   cp .env.example .dev.vars
   ```

4. **Fill `.dev.vars` Values**:
   Open `.dev.vars` in your editor and replace the placeholders.

   **Required for notification API (`/send/...`):**
   - `API_SECRET_KEY` → paste the key from `npm run generate-key`
   - `TELEGRAM_BOT_TOKEN` → paste the token from BotFather
   - `TELEGRAM_DEFAULT_CHAT_ID` → paste your Chat ID

   **Optional (Coolify deploy triggers):**
   - `COOLIFY_WEBHOOK`
   - `COOLIFY_TOKEN`
   - Or project-specific pairs like `COOLIFY_WEBHOOK_URL_FRONTEND` / `COOLIFY_TOKEN_FRONTEND`

   **Required for Google Auth (`/auth/google/...`):**
   - Fill these after you complete the [Google Auth Setup](#google-auth-setup-step-by-step) section below:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `GOOGLE_REDIRECT_URI`
     - `JWT_SECRET`
     - `ALLOWED_RETURN_ORIGINS`

   Example (local Google Auth):
   ```env
   GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
   GOOGLE_REDIRECT_URI=http://127.0.0.1:8787/auth/google/callback
   JWT_SECRET=paste_another_generate-key_output_here
   ALLOWED_RETURN_ORIGINS=http://localhost:3000
   ```

### Step 3: Test Locally (Optional)

Before putting it on the internet, you can test the worker on your computer.
```bash
npm run dev
```
The worker will start locally on port `8787` (e.g., `http://127.0.0.1:8787`).

- Health check: open `http://127.0.0.1:8787/`
- Telegram/Coolify: use the cURL examples in [API Usage](#api-usage)
- Google Auth: use the examples in [Google Auth API Usage](#google-auth-api-usage)

> **Note:** Google Auth also needs an `AUTH_KV` binding in `wrangler.toml`. Complete [Google Auth Setup → Step G2](#g2-create-the-cloudflare-kv-namespace) before testing Google login locally.

---

### Step 4: Connect to Cloudflare and Deploy

Once you are ready, put the worker on the Cloudflare Edge network.

1. **Login to Cloudflare**:
   ```bash
   npx wrangler login
   ```
   A browser tab will open. Click **Allow**.

2. **Create KV (only if you use Google Auth)**:
   Follow [G2](#g2-create-the-cloudflare-kv-namespace) and put the IDs into `wrangler.toml` **before** deploying.

3. **Send Secret Variables to Cloudflare**:
   Cloudflare does **not** upload `.dev.vars`. You must set secrets explicitly.

   **Always (notification API):**
   ```bash
   npx wrangler secret put API_SECRET_KEY
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_DEFAULT_CHAT_ID
   ```

   **If you use Coolify:**
   ```bash
   npx wrangler secret put COOLIFY_WEBHOOK
   npx wrangler secret put COOLIFY_TOKEN
   ```

   **If you use Google Auth:**
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler secret put JWT_SECRET
   ```

   After each command, paste the value and press Enter.

4. **Set Non-Secret Google Variables (Dashboard or Wrangler)**:
   These are not as sensitive as secrets, but they are still required for Google Auth.

   Option A — Cloudflare Dashboard:
   1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
   2. Click your worker (`cloudflare-notify`)
   3. Go to **Settings** → **Variables and Secrets**
   4. Add these **Plaintext** variables:
      - `GOOGLE_REDIRECT_URI` = `https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/auth/google/callback`
      - `ALLOWED_RETURN_ORIGINS` = `https://myapp.example.com` (comma-separated if you have more than one)

   Option B — `wrangler.toml` `[vars]` block:
   ```toml
   [vars]
   GOOGLE_REDIRECT_URI = "https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/auth/google/callback"
   ALLOWED_RETURN_ORIGINS = "https://myapp.example.com,http://localhost:3000"
   ```

5. **Deploy the Worker**:
   ```bash
   npm run deploy
   ```

Your service is now live! 🎉 Cloudflare will provide a URL like `https://cloudflare-notify.<YOUR_USERNAME>.workers.dev`.

6. **Update Google Console Redirect URI for Production**:
   After deploy, go back to Google Cloud Console and make sure the **production** callback URI is listed (see [G1](#g1-create-google-oauth-credentials)).

---

## Google Auth Setup (Step-by-Step)

Use this section if you want the Worker to be a Google sign-in / sign-up intermediary.

### What this does

1. Your app opens: `GET /auth/google/start?return_to=<YOUR_APP_CALLBACK_URL>`
2. Worker redirects the user to Google
3. Google redirects to Worker: `GET /auth/google/callback`
4. Worker verifies the user, stores/updates the profile in KV, then redirects to your `return_to` URL with:
   - `token` — Worker-signed JWT (your app uses this as the login session)
   - `is_new_user` — `true` on first login (sign-up), `false` on later logins (sign-in)
   - `provider=google`
5. Your app stores the JWT and can call `GET /auth/me` later to validate it

### G1: Create Google OAuth Credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or select an existing one).
3. Go to **APIs & Services** → **OAuth consent screen**:
   - Choose **External** (unless you only use Google Workspace internal users)
   - Fill App name, User support email, Developer contact
   - Save and continue through the screens (Scopes can stay default for now: `openid`, `email`, `profile` are requested by the Worker)
   - Add test users if the app is still in **Testing** mode
4. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name it, for example: `cloudflare-notify-auth`
7. Under **Authorized redirect URIs**, click **Add URI** and add **exactly**:
   - Local testing: `http://127.0.0.1:8787/auth/google/callback`
   - Production: `https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/auth/google/callback`
8. Click **Create**
9. Copy:
   - **Client ID** → this becomes `GOOGLE_CLIENT_ID`
   - **Client Secret** → this becomes `GOOGLE_CLIENT_SECRET`

> Important: `GOOGLE_REDIRECT_URI` in your env must match one of the Authorized redirect URIs **character-for-character** (including `http` vs `https`, trailing slash, and host).

### G2: Create the Cloudflare KV Namespace

Google Auth stores temporary OAuth `state` and user profiles in KV.

1. Make sure you are logged in (`npx wrangler login`).
2. Create production and preview namespaces:
   ```bash
   npx wrangler kv namespace create AUTH_KV
   npx wrangler kv namespace create AUTH_KV --preview
   ```
3. Each command prints an ID. Open `wrangler.toml` and replace the placeholders:
   ```toml
   [[kv_namespaces]]
   binding = "AUTH_KV"
   id = "PASTE_PRODUCTION_ID_HERE"
   preview_id = "PASTE_PREVIEW_ID_HERE"
   ```
4. Save the file.

### G3: Fill Local Google Variables in `.dev.vars`

Open `.dev.vars` and set:

| Variable | What to put |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID from Google Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret from Google Console |
| `GOOGLE_REDIRECT_URI` | Local callback, usually `http://127.0.0.1:8787/auth/google/callback` |
| `JWT_SECRET` | Output of another `npm run generate-key` run |
| `ALLOWED_RETURN_ORIGINS` | Origins of your app that may receive the login result, comma-separated |

**How to choose `ALLOWED_RETURN_ORIGINS`:**
- If your app runs at `http://localhost:3000/auth/callback`, origin is `http://localhost:3000`
- If your app runs at `https://myapp.example.com/login/callback`, origin is `https://myapp.example.com`
- Multiple apps/environments:
  ```env
  ALLOWED_RETURN_ORIGINS=http://localhost:3000,https://myapp.example.com
  ```

**Example filled block:**
```env
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://127.0.0.1:8787/auth/google/callback
JWT_SECRET=64_char_random_string_from_generate-key
ALLOWED_RETURN_ORIGINS=http://localhost:3000
```

### G4: Test Google Auth Locally

1. Start the worker:
   ```bash
   npm run dev
   ```
2. In your browser, open (replace the `return_to` with your real app callback URL):
   ```text
   http://127.0.0.1:8787/auth/google/start?return_to=http://localhost:3000/auth/callback
   ```
3. Choose a Google account and approve access.
4. You should land on your app callback with query params like:
   ```text
   http://localhost:3000/auth/callback?token=eyJ...&is_new_user=true&provider=google
   ```
5. Optional: validate the token:
   ```bash
   curl http://127.0.0.1:8787/auth/me \
     -H "Authorization: Bearer PASTE_TOKEN_HERE"
   ```

### G5: Configure Google Auth for Production

1. Deploy (or redeploy) after KV IDs are in `wrangler.toml`:
   ```bash
   npm run deploy
   ```
2. Set secrets:
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler secret put JWT_SECRET
   ```
3. Set plaintext variables (Dashboard → Worker → Settings → Variables, or `[vars]` in `wrangler.toml`):
   - `GOOGLE_REDIRECT_URI` = `https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/auth/google/callback`
   - `ALLOWED_RETURN_ORIGINS` = your production app origin(s)
4. In Google Cloud Console, ensure the **production** redirect URI is added under Authorized redirect URIs.
5. Test with:
   ```text
   https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/auth/google/start?return_to=https://myapp.example.com/auth/callback
   ```

### G6: What Your App Must Do

1. Send the user to Worker `/auth/google/start` with a `return_to` URL that belongs to an allowed origin.
2. On the callback page, read:
   - `token` → save it (localStorage, cookie, secure storage, etc.)
   - `is_new_user` → `true` means first-time sign-up, `false` means sign-in
   - `error` → if present, show a login failure message
3. For authenticated API calls to your own backend, send the JWT, or call Worker `/auth/me` to verify it.

---

## Environment Variables Reference

Use this checklist when filling `.dev.vars` (local) or Cloudflare secrets/vars (production).

### Core / Notifications

| Name | Required? | Where to set | Description |
|---|---|---|---|
| `API_SECRET_KEY` | Yes (for `/send/...`) | `.dev.vars` + `wrangler secret put` | Bearer token your clients send to call `/send/...` |
| `TELEGRAM_BOT_TOKEN` | Yes (for Telegram) | `.dev.vars` + secret | Bot token from `@BotFather` |
| `TELEGRAM_DEFAULT_CHAT_ID` | Yes (for Telegram) | `.dev.vars` + secret | Default destination chat/group/channel ID |
| `COOLIFY_WEBHOOK` | Optional | `.dev.vars` + secret | Default Coolify deploy webhook |
| `COOLIFY_TOKEN` | Optional | `.dev.vars` + secret | Default Coolify API/token value |

### Google Auth

| Name | Required? | Where to set | Description |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes (for Google Auth) | `.dev.vars` + secret | OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes (for Google Auth) | `.dev.vars` + secret | OAuth Client Secret from Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Yes (for Google Auth) | `.dev.vars` + plaintext var | Must equal Worker callback URL registered in Google |
| `JWT_SECRET` | Yes (for Google Auth) | `.dev.vars` + secret | Secret used to sign/verify JWTs returned to your app |
| `ALLOWED_RETURN_ORIGINS` | Yes (for Google Auth) | `.dev.vars` + plaintext var | Comma-separated allowed origins for `return_to` |
| `AUTH_KV` | Yes (for Google Auth) | `wrangler.toml` KV binding | Not an env string; created via `wrangler kv namespace create` |

### Quick copy checklist for `.dev.vars`

```env
# Notifications
API_SECRET_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_DEFAULT_CHAT_ID=

# Optional Coolify
# COOLIFY_WEBHOOK=
# COOLIFY_TOKEN=

# Google Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:8787/auth/google/callback
JWT_SECRET=
ALLOWED_RETURN_ORIGINS=http://localhost:3000
```

---

## API Usage

To send a message, make an HTTP POST request to your worker URL (e.g., `https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/send/telegram`).

You **must** include the header `Authorization: Bearer YOUR_API_SECRET_KEY`.

### Example 1: Send a Simple Text Message

```bash
curl -X POST https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/send/telegram \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello! This is a test message from the Cloudflare Worker."
  }'
```

### Example 2: Send a Structured Report (Crash Report / Logs)

If you are sending logs or error reports, you can send a neatly aligned, table-like log message by passing a `fields` object instead of raw text:

```bash
curl -X POST https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/send/telegram \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Crash Report 🚨",
    "fields": {
      "Environment": "Production",
      "Error Code": 500,
      "Message": "Database connection timeout",
      "Module": "Auth Service"
    }
  }'
```

### Example 3: Send to a Specific Chat ID

By default, messages go to `TELEGRAM_DEFAULT_CHAT_ID`. If you want to send a specific message to a different user or group, just add `chat_id` to your JSON payload:

```bash
curl -X POST https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/send/telegram \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "-100987654321",
    "text": "This message goes to a different group!"
  }'
```

---

## Google Auth API Usage

### Start sign-in / sign-up

Open this URL from your app (browser redirect or button link):

```text
https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/auth/google/start?return_to=https://myapp.example.com/auth/callback
```

Local:

```text
http://127.0.0.1:8787/auth/google/start?return_to=http://localhost:3000/auth/callback
```

### Success redirect back to your app

```text
https://myapp.example.com/auth/callback?token=eyJ...&is_new_user=false&provider=google
```

| Query param | Meaning |
|---|---|
| `token` | JWT issued by the Worker. Treat this as the logged-in session token. |
| `is_new_user` | `true` = first login (sign-up), `false` = returning user (sign-in) |
| `provider` | Always `google` for this flow |

### Failure redirect back to your app

```text
https://myapp.example.com/auth/callback?error=access_denied&provider=google
```

Common `error` values:
- `access_denied` — user cancelled Google consent
- `email_not_verified` — Google account email is not verified
- `token_exchange_failed` — Worker could not exchange the auth code
- `userinfo_failed` — Worker could not read the Google profile
- `missing_code` — Google did not return an auth code
- `internal_error` — unexpected Worker error

### Validate the current user

```bash
curl https://cloudflare-notify.<YOUR_USERNAME>.workers.dev/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Example success response:

```json
{
  "ok": true,
  "user": {
    "id": "google-user-sub",
    "email": "user@gmail.com",
    "name": "Example User",
    "picture": "https://...",
    "provider": "google"
  }
}
```
