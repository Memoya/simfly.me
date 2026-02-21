# Deployment Guide for Simfly.me

This guide covers two methods to deploy the application:
1.  **Docker (Recommended for SQLite)** - Good for VPS (Hetzner, DigitalOcean) or local servers.
2.  **Vercel (Cloud)** - Requires switching to PostgreSQL.

---

## Option 1: Docker (With SQLite Persistence)

Since the app uses SQLite, Docker is the easiest way to deploy while keeping the database file persistent on your server.

### Prerequisites
- A server (VPS) with **Docker** and **Docker Compose** installed.
- Access to your codebase (via Git or SCP).

### Steps

1.  **Configure Environment**:
    Create a `.env` file on your server (same directory as `docker-compose.yml`) with your production secrets:
    ```env
    DATABASE_URL="file:/app/data/prod.db"
    NEXT_PUBLIC_BASE_URL="https://your-domain.com"
    ESIM_ACCESS_CODE="your-access-code"
    ESIM_ACCESS_SECRET="your-access-secret"
    ESIM_ACCESS_TEST_MODE="false"
    STRIPE_SECRET_KEY="sk_live_..."
    ADMIN_PASSWORD="secure-password"
    RESEND_API_KEY="re_..."
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-token"
    ```

2.  **Build & Run**:
    Run the following command to build the image and start the container:
    ```bash
    docker-compose up -d --build
    ```

3.  **Verify**:
    The app should be running on `http://localhost:3000`.
    - You can set up Nginx as a reverse proxy to handle HTTPS/SSL (Certbot).

4.  **Database Management**:
    The database is stored in the `./data` folder on the host machine.
    - **Backup**: Simply copy the `./data/prod.db` file.
    - **Migrations**: To run migrations inside the container:
      ```bash
      docker-compose exec app npx prisma migrate deploy
      ```

---

## Option 2: Vercel (Requires PostgreSQL)

Vercel is a serverless platform and **does not support SQLite files** because the filesystem is ephemeral (deleted after requests).

### Migration to PostgreSQL
1.  **Get a Database**: Sign up for [Neon](https://neon.tech) or [Supabase](https://supabase.com) and get a connection string.
2.  **Update Schema**:
    Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
3.  **Update Env**:
    Set `DATABASE_URL` to your new Postgres connection string (e.g., `postgres://user:pass@host:5432/db`).
4.  **Deploy**:
    - Push your code to GitHub.
    - Import the project in Vercel.
    - Add all environment variables in the Vercel Dashboard.
    - Vercel will automatically build and deploy.

---

## Troubleshooting

### "Prisma Client not found"
If you see errors about Prisma Client, run:
```bash
docker-compose exec app npx prisma generate
```
(Note: The Dockerfile already does this during build, but sometimes runtime envs affect it).
