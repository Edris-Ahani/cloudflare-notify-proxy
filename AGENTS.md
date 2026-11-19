# Project Guidelines & Architectural Rules

## 1. Absolute Environment Variable Integrity & Complete Deprecation Lifecycle

Whenever any environment variable is deprecated, made obsolete, or removed from the system architecture:
- It **MUST** be eliminated comprehensively and synchronously from ALL files across the repository and workspace:
  1. **Active Local Secrets (Git-Ignored):** `.env`, `.dev.vars`, `backend/.env`.
  2. **Template & Example Manifests:** `.env.example`, `.env.docker.example`.
  3. **Orchestration Configs:** `docker-compose.yml`, `docker-compose.local.yml`.
  4. **Docker Build Configurations:** `Dockerfile`, `web/Dockerfile`, `backend/Dockerfile` (including all `ARG` and `ENV` declarations).
  5. **Application Source Code:** All `process.env.VAR_NAME` usages and fallback definitions.
  6. **Documentation & Platform Guides:** `README.md`, `COOLIFY.md`, and in-app documentation components (`/dashboard/docs`).
- **Zero Orphan Policy:** Never leave dangling, dead, or unused environment variable definitions in any config file, template, or active `.env`. Every declared variable must have an active, intentional purpose in the codebase.
