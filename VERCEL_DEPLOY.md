# Deploying Simfly to Vercel

Since Vercel is a serverless platform, we have switched the database configuration to **PostgreSQL**. You will need a cloud database provider.

## Prerequisite: Cloud Database

We recommend **[Neon](https://neon.tech)** (easiest for Vercel) or **[Supabase](https://supabase.com)**.

1.  **Create a Account** on Neon or Supabase.
2.  **Create a Project**.
3.  **Get Connection String**:
    - Look for a connection string that starts with `postgres://...`
    - Make sure to use the "pooled" connection string if available (especially for serverless), or the direct one for migrations.

## Step 1: Deploy Code

1.  Push your code to a GitHub repository.
2.  Log in to **[Vercel](https://vercel.com)**.
3.  Click **"Add New..."** -> **"Project"**.
4.  Import your GitHub repository.

## Step 2: Configure Environment Variables

In the Vercel Project Settings, add the following Environment Variables:

| Variable | Value |
| :--- | :--- |
| `DATABASE_URL` | Your **PostgreSQL Connection String** from Neon/Supabase. |
| `NEXT_PUBLIC_BASE_URL` | `https://your-project.vercel.app` (or your custom domain). |
| `ESIM_GO_API_KEY` | Your eSIM Go API Key. |
| `STRIPE_SECRET_KEY` | Your Stripe Secret Key. |
| `ADMIN_PASSWORD` | Your robust Admin Password. |
| `RESEND_API_KEY` | Your Resend API Key. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Verification Token (optional). |

## Step 3: Database Migration

After deployment, your database will be empty. You need to push the schema to the new cloud database.

**Option A: Run from Local Machine (Easiest)**
1.  In your local `.env` file, change `DATABASE_URL` to your **remote** PostgreSQL connection string temporarily.
2.  Run:
    ```bash
    npx prisma db push
    ```
3.  This will create the tables in your cloud database.
4.  (Optional) Change your local `.env` back to SQLite if you want to keep developing locally with `sqlite`.

**Option B: Connect via Build Command**
- You can add `npx prisma db push` to your generic build command, but Option A is safer for control.

## Troubleshooting

- **500 Error on Database Access**: Check your `DATABASE_URL` in Vercel to ensure it's correct.
- **Connection Limit Reached**: If using Neon/Supabase, use the **PgBouncer / Pooled** connection string if possible.
