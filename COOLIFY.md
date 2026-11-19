# Coolify Deployment & Infrastructure Guide

This guide provides end-to-end instructions for deploying the **Cloudflare Notify** platform on [Coolify](https://coolify.io/), as well as running the stack locally.

---

## 1. Architecture Overview on Coolify

In production on Coolify, the infrastructure is decoupled for reliability, persistent storage, and zero-downtime upgrades:

```
┌─────────────────────────────────────────────────────────────┐
│                       Coolify Host                          │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │  Managed PostgreSQL   │       │   Traefik Ingress     │  │
│  │  (Standalone Service) │       │   (Reverse Proxy)     │  │
│  └──────────┬────────────┘       └───────────┬───────────┘  │
│             │                                │              │
│ ════════════╪═════════ coolify network ══════╪═════════════ │
│             │                                │              │
│  ┌──────────▼────────────┐       ┌───────────▼───────────┐  │
│  │   NestJS Backend      │◄─────►│    Next.js Frontend   │  │
│  │   (Port 4000)         │       │    (Port 3000)        │  │
│  └───────────────────────┴───────┴───────────────────────┘  │
│               app-network (internal bridge)                 │
└─────────────────────────────────────────────────────────────┘
```

1. **PostgreSQL Database:** Deployed as an independent, standalone Coolify database service. It is attached to the default `coolify` Docker network.
2. **Backend & Frontend Stack:** Deployed via `docker-compose.yml`. Both services are multi-homed on `app-network` (inter-service communication) and the external `coolify` network (direct internal access to PostgreSQL without exposing ports to the public internet).
3. **Automated Migrations:** On container startup, the backend automatically runs `npx prisma migrate deploy` with a resilient retry loop until PostgreSQL accepts connections, ensuring clean database synchronization before NestJS initializes.

---

## 2. Step-by-Step Coolify Deployment

### Step 1: Deploy Standalone PostgreSQL in Coolify

1. Open your Coolify Dashboard and navigate to your Project / Environment.
2. Click **+ New Resource** ➔ **Databases** ➔ **PostgreSQL**.
3. Choose a name (e.g. `cf-notify-db`).
4. Click **Start Database**.
5. Once running, go to the database **Configuration** tab and copy the **Internal Database URL**:
   ```
   postgresql://postgres:<password>@<container-name-or-uuid>:5432/postgres?schema=public
   ```
   *(Note: This internal URL is accessible only within the `coolify` Docker network, keeping your data secure).*

---

### Step 2: Deploy the Application via Docker Compose

1. In Coolify, click **+ New Resource** ➔ **Git Repository** (or **Docker Compose**).
2. Point it to this repository (`https://github.com/your-username/cloudflare-notify`).
3. Select the `main` branch.
4. Coolify will detect `docker-compose.yml`.
5. Under **Environment Variables**, configure the following keys:

| Environment Variable | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:pass@cf-notify-db:5432/postgres?schema=public` | Copied from Step 1 |
| `JWT_SECRET` | `generate-random-32-char-string-for-sessions` | Signs user JWT auth cookies |
| `ENCRYPTION_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | 32-byte hex key for user credentials |
| `FRONTEND_URL` | `https://notify.yourdomain.com` | Public URL of the frontend dashboard (CORS) |
| `TELEGRAM_PROXY_WORKER_URL` | `https://your-worker.workers.dev` | (Optional) Fallback proxy worker |
| `TELEGRAM_PROXY_SECRET` | `your_worker_secret_key` | (Optional) Secret for proxy worker |

6. In Coolify's domain settings:
   - Map your frontend domain (e.g. `notify.ozonecowork.ir`) to the `frontend` container on **Port 3000**.
   - *(Note: Backend does NOT require an external domain; Next.js proxies `/api` directly to backend container over Docker network).*
7. Click **Deploy**.

---

### Step 3: Verification & Network Health Check

1. In the Coolify deployment logs, verify that Prisma executed migrations cleanly:
   ```text
   Prisma schema loaded from prisma/schema.prisma
   Datasource "db": PostgreSQL database
   Applying migration `...`
   The following migration(s) have been applied!
   Backend server successfully started on port 4000
   ```
2. If you ever need to test network reachability to PostgreSQL from the backend container, open the **Terminal** tab for the backend container in Coolify and run:
   ```bash
   nc -zv <db-container-name> 5432
   ```
   You should see `open`.

---

## 3. Local Offline Development

To run the entire stack locally on your computer with a self-contained PostgreSQL instance:

```bash
# Start all 3 containers (PostgreSQL, NestJS Backend, Next.js Frontend)
docker compose -f docker-compose.local.yml up -d --build

# View container status
docker compose -f docker-compose.local.yml ps

# Check logs
docker compose -f docker-compose.local.yml logs -f backend

# Stop the stack
docker compose -f docker-compose.local.yml down
```

Access locally at:
- **Frontend Dashboard:** [http://localhost:15434](http://localhost:15434)
- **Backend API:** [http://localhost:15433](http://localhost:15433)
- **PostgreSQL Database:** `localhost:15432` (user: `postgres`, password: `postgres`)

---

## 4. Triggering Coolify Deployments via Cloudflare Proxy (Optional)

This platform also includes support for triggering Coolify webhooks through your Cloudflare Worker proxy (`/send/coolify`).

### Why use a Proxy for Coolify?
1. **Enhanced Security**: Your Coolify URL and Token remain securely hidden inside your Cloudflare Worker environment.
2. **Simplified CI/CD**: Your repositories only need to know the Cloudflare Worker URL and a single proxy `API_SECRET_KEY`.
3. **Centralized Management**: If your Coolify token changes, update it once in Cloudflare instead of multiple GitHub/GitLab repositories.

### Environment Variables on Worker:
- `COOLIFY_WEBHOOK`: The exact webhook URL from Coolify (e.g., `https://coolify.yourdomain.com/api/v1/deploy?uuid=...`)
- `COOLIFY_TOKEN`: Your Coolify API Bearer Token.
- `API_SECRET_KEY`: The authorization key for your proxy.

### Dynamic Multi-Project Routing:
Define project pairs:
- `COOLIFY_WEBHOOK_URL_API` / `COOLIFY_TOKEN_API` ➔ `/send/coolify/api`
- `COOLIFY_WEBHOOK_URL_FRONTEND` / `COOLIFY_TOKEN_FRONTEND` ➔ `/send/coolify/frontend`
