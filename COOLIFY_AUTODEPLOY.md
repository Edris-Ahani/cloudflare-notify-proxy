# Automated Deployment to Coolify on Git Push

This guide explains how to set up continuous deployment (CI/CD) so that whenever you push commits to the `main` branch, your Coolify instance automatically pulls the latest changes, builds the Docker containers, runs Prisma migrations, and deploys without downtime.

---

## Architecture Flow

```
[Developer / Local Machine]
       │
       ▼  git push origin main
[GitHub / GitLab Repository]
       │
       ├────────────────────────────────────────┐
       │ (Method 1: Direct Webhook)             │ (Method 2: GitHub Actions)
       ▼                                        ▼
[Coolify Git Webhook Listener]           [GitHub Actions Runner]
       │                                        │ curl POST Deploy URL
       └───────────────────┬────────────────────┘
                           ▼
                 [Coolify Deployment Engine]
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [Pull Latest Commits]      [Rebuild Docker Images]
             │                           │
             ▼                           ▼
  [Run Prisma Migrations]      [Zero-Downtime Container Restart]
```

---

## Method 1: Native Coolify Git Webhook (Recommended — Zero Code)

This is the standard, production-ready method. It requires **no extra files or code in your repository**.

### Step 1: Configure Auto Deploy in Coolify
1. Log in to your Coolify dashboard.
2. Navigate to your **Project** ➔ **Environment** ➔ select your **cloudflare-notify** application resource.
3. Open the **Configuration** ➔ **General** tab:
   - Ensure **Branch** is set to `main`.
   - Toggle **Auto Deploy** (or **Deploy on push**) to **ON / Enabled**.
4. Save changes.

### Step 2: Obtain the Webhook URL from Coolify
1. In the application settings menu, click on the **Webhooks** tab.
2. Locate the **Git Webhook** section:
   - Copy the **Webhook URL** (e.g. `https://coolify.yourdomain.com/webhooks/source/github/events` or your resource-specific webhook endpoint).
   - If a **Webhook Secret** is generated, copy it as well.

### Step 3: Add Webhook to GitHub Repository
1. Open your repository on GitHub (`https://github.com/<your-account>/cloudflare-notify`).
2. Go to **Settings** ➔ **Webhooks** (in the left sidebar).
3. Click **Add webhook**.
4. Configure the webhook:
   - **Payload URL:** Paste the URL copied from Coolify.
   - **Content type:** Select `application/json`.
   - **Secret:** Paste the secret from Coolify (leave blank if none was specified).
   - **SSL verification:** Select `Enable SSL verification`.
   - **Which events would you like to trigger this webhook?:** Select **Just the push event**.
   - Ensure the **Active** checkbox is checked.
5. Click **Add webhook**.

### Step 4: Verification
1. Push a test commit to `main`:
   ```bash
   git commit --allow-empty -m "chore: test coolify autodeploy webhook"
   git push origin main
   ```
2. Check your GitHub Webhook page: you should see a recent delivery with a green checkmark (`200 OK`).
3. Open your Coolify dashboard ➔ **Deployments** tab: a new deployment will start automatically.

---

## Method 2: GitHub Actions Workflow (With CI/CD Pipeline Logs)

Use this method if you want GitHub to run automated tests or linting first before triggering Coolify, or if you want to track deployment statuses directly inside your GitHub pull requests and commit history.

### Step 1: Obtain the Deploy Webhook URL from Coolify
1. In Coolify, open your application resource and navigate to the **Webhooks** tab.
2. Locate the **Deploy Webhook** (manual trigger endpoint), which looks like:
   ```text
   https://coolify.yourdomain.com/api/v1/deploy?uuid=<resource-uuid>&force=false
   ```
3. If your Coolify instance requires API authentication, generate an API Bearer token in **Keys & Tokens** ➔ **API Tokens**.

### Step 2: Store Secrets in GitHub
1. In your GitHub repository, navigate to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
2. Click **New repository secret**:
   - Name: `COOLIFY_DEPLOY_WEBHOOK`
   - Value: Paste the deploy webhook URL from Step 1.
3. (Optional) If Bearer authentication is required:
   - Name: `COOLIFY_API_TOKEN`
   - Value: Paste your Coolify API Bearer token.

### Step 3: Add the Workflow File to Repository
Create the file `.github/workflows/deploy.yml` in your repository:

```yaml
name: Continuous Deployment to Coolify

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Trigger Coolify Deploy
    runs-on: ubuntu-latest
    steps:
      - name: Send Deployment Signal to Coolify
        run: |
          response=$(curl -s -w "%{http_code}" -X GET "${{ secrets.COOLIFY_DEPLOY_WEBHOOK }}" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_API_TOKEN }}" \
            -H "Accept: application/json")
          
          http_code="${response: -3}"
          body="${response:0:${#response}-3}"
          
          echo "Response status: $http_code"
          echo "Response body: $body"
          
          if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
            echo "Coolify deployment successfully triggered!"
          else
            echo "Failed to trigger Coolify deployment (HTTP $http_code)"
            exit 1
          fi
```

---

## Summary Comparison

| Feature | Method 1: Native Coolify Webhook | Method 2: GitHub Actions |
| :--- | :--- | :--- |
| **Setup Complexity** | Very Low (2 minutes, no code) | Low (requires workflow YAML & secrets) |
| **Repository Overhead** | None | `.github/workflows/deploy.yml` |
| **Build Location** | Directly on your Coolify VPS | Triggered on VPS via GitHub runner |
| **Prerequisites** | Coolify server publicly reachable by GitHub | Coolify server publicly reachable by GitHub |
| **Best For** | Standard production setups, zero-maintenance | Multi-stage CI/CD pipelines (tests before deploy) |

---

## Best Practices & Troubleshooting

1. **Database Migration Safety:**
   - Both NestJS backend and Prisma migrations execute automatically on container startup (`npx prisma migrate deploy`).
   - If a migration fails, Coolify will keep the old container running (Zero-Downtime protection) and mark the deployment as failed in the logs.

2. **Coolify Traefik Port Binding:**
   - Ensure the application domain (`notify.ozonecowork.ir`) in Coolify is mapped to **Port 3000** (the Next.js frontend container).
   - The backend runs on internal port 4000 and is accessed via internal Docker proxy rewrites.

3. **Checking Deployment Status:**
   - In Coolify, monitor live build logs under the **Deployments** tab of your application.
