# Environment Variable Configuration Guide

To ensure all features (Prisma, Stripe, eSIM Go, Resend, SEO) work correctly in production, please configure the following environment variables.

## Required Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Prisma SQLite connection string | `file:./data/prod.db` |
| `NEXT_PUBLIC_BASE_URL` | The public URL of your site | `https://simfly.me` |
| `ESIM_GO_API_KEY` | Your eSIM Go API Key | `yoRLA4...` |
| `STRIPE_SECRET_KEY` | Your Stripe Secret Key (Live/Test) | `sk_test_...` |
| `ADMIN_PASSWORD` | Password for the Admin Dashboard | `your-secure-password` |
| `RESEND_API_KEY` | Your Resend API Key for emails | `re_...` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console token | `None` |

## Optional / SEO Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console token | `None` |

> [!IMPORTANT]
> - Ensure `NEXT_PUBLIC_BASE_URL` does NOT have a trailing slash.
> - For Vercel or other cloud providers, make sure to add these in the project settings.
