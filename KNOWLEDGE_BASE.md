# OC Client Backend — Knowledge Base

## 🎯 Purpose
The **Client Backend** receives documents from the Provider Backend and serves them securely to client-facing applications.  
It is optimized for read-heavy operations and designed to scale independently from provider workloads.

---

## 🧩 Key Components

| Component | Description |
|------------|-------------|
| **NestJS Application** | Main backend framework for APIs. |
| **PostgreSQL Database (oc-client-pg)** | Stores received documents and associated access codes. |
| **Document Module** | Persists and serves shared documents. |
| **AccessCode Module** | Generates, stores, and validates access tokens. |
| **Security Layer** | Handles access expiration and rate limiting. |

---

## 🔗 Interactions

- **With Provider Backend**
  - Receives documents via:
    ```http
    POST /v1/documents
    ```
  - Returns a unique access code:
    ```json
    { "accessCode": "ABC123" }
    ```

- **With Client Frontend**
  - Serves read-only API:
    ```http
    GET /api/public/:accessCode
    ```
  - Returns:
    ```json
    { "title": "...", "content": "...", "createdAt": "..." }
    ```

- **With Ingress / Kong**
  - Internal DNS: `oc-client-backend.oc-client.svc.cluster.local`
  - Public route: `https://client.on-track.ch/api`

---

## ⚙️ Deployment & CI/CD

- **Repo:** `oc-client-backend`
- **Language:** Node.js (NestJS)
- **Image:** `ghcr.io/<username>/oc-client-backend`
- **Namespace:** `oc-client`
- **Secrets:** `DATABASE_URL` (via Kubernetes secret)
- **Service:** `oc-client-backend:80`
- **Ingress:** `/api` → backend

## Commit Message Rules

```
type(scope): Description
```

Examples:

```
feat(workspace): Add Save to Library button
fix(prescriptions): Prevent sending summary before finalize
refactor(composables): Extract persona state logic from workspace
```

---

## Release Flow

```
git checkout main
git pull
git merge dev
npm version <patch|minor|major>
git push && git push --tags
Create RELEASE-NOTES.md (manual high-level wording)
```