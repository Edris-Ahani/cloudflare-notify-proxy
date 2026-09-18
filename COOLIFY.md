# Coolify Deployment Webhook via Cloudflare Proxy

This document explains how to use the `cloudflare-notify-proxy` to securely trigger deployments on [Coolify](https://coolify.io/).

## Why use a Proxy for Coolify?

Normally, to trigger a deployment from GitHub Actions or GitLab CI, you need to provide your Coolify webhook URL and your Coolify Bearer Token in your CI/CD secrets. 
By using this proxy:
1. **Enhanced Security**: Your Coolify URL and Token remain securely hidden inside your Cloudflare Worker environment.
2. **Simplified CI/CD**: Your repositories only need to know the Cloudflare Worker URL and a single proxy `API_SECRET_KEY`.
3. **Centralized Management**: If your Coolify token changes, you only update it once in Cloudflare, instead of updating multiple GitHub/GitLab repositories.

---

## 1. Cloudflare Worker Setup

First, configure your Coolify credentials in your Cloudflare Worker environment. 

You can set these via the Cloudflare Dashboard (`Workers & Pages` > `Settings` > `Variables`) or by using the `wrangler` CLI.

Required Environment Variables:
- `COOLIFY_WEBHOOK`: The exact webhook URL from Coolify (e.g., `https://coolify.yourdomain.com/api/v1/deploy?uuid=...`)
- `COOLIFY_TOKEN`: Your Coolify API Bearer Token.
- `API_SECRET_KEY`: The authorization key for your proxy (used in the CI/CD).

### Handling Multiple Projects

If you have multiple Coolify projects, you don't need to change the Worker code. Instead, use **Dynamic Routing**.
Add environment variables using the `COOLIFY_WEBHOOK_URL_<PROJECT>` and `COOLIFY_TOKEN_<PROJECT>` naming convention:

- `COOLIFY_WEBHOOK_URL_API` = `https://.../deploy?uuid=abc`
- `COOLIFY_TOKEN_API` = `token_for_api`
- `COOLIFY_WEBHOOK_URL_FRONTEND` = `https://.../deploy?uuid=xyz`
- `COOLIFY_TOKEN_FRONTEND` = `token_for_frontend`

Then, you can trigger these specific deployments by adding the project name to the URL, e.g., `/send/coolify/api` or `/send/coolify/frontend`.

---

## 2. Triggering Deployments

To trigger a deployment, send a `GET` or `POST` request to your Cloudflare Worker's `/send/coolify` endpoint (or `/send/coolify/<PROJECT_NAME>`).

### Example: GitHub Actions

In your `.github/workflows/deploy.yml`:

```yaml
name: Trigger Coolify Deploy

on:
  push:
    branches: ["main"]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Call Coolify Webhook via Proxy
        run: |
          echo "Triggering deployment via Cloudflare Worker..."
          curl --request GET "https://<YOUR_WORKER_URL>.workers.dev/send/coolify" \
               --header "Authorization: Bearer ${{ secrets.PROXY_API_SECRET_KEY }}" \
               --header "Accept: application/json"
          echo -e "\nDeployment request sent successfully!"
```
*(Make sure to add `PROXY_API_SECRET_KEY` to your GitHub Repository Secrets).*

### Example: GitLab CI

In your `.gitlab-ci.yml`:

```yaml
stages:
  - deploy

deploy_to_coolify:
  stage: deploy
  script:
    - echo "Triggering deployment via Cloudflare Worker..."
    - >
      curl --request GET "https://<YOUR_WORKER_URL>.workers.dev/send/coolify"
      --header "Authorization: Bearer $PROXY_API_SECRET_KEY"
      --header "Accept: application/json"
  only:
    - main
```
*(Make sure to add `PROXY_API_SECRET_KEY` to your GitLab CI/CD Variables).*

### Example: Manual cURL

You can also trigger it manually from your terminal:

```bash
curl --request GET "https://<YOUR_WORKER_URL>.workers.dev/send/coolify" \
     --header "Authorization: Bearer YOUR_API_SECRET_KEY" \
     --header "Accept: application/json"
```

---

## Response 

The proxy will return the exact response received from the Coolify server. 

**Success Response (HTTP 200)**:
```json
{
  "httpStatus": 200,
  "message": "Deployment started successfully"
}
```

**Error Response**:
If the Coolify configuration is missing in the Cloudflare Worker, you will receive an HTTP 500:
```json
{
  "ok": false,
  "error": "Coolify webhook URL or token is not configured"
}
```
