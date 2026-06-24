# MineControl

A private Minecraft server control panel built with Next.js, deployed on Vercel.  
Manage EC2 instances, monitor server status, and control Minecraft — from any device.

---

## Features

- 🔐 Discord OAuth authentication with allowlist
- 🚀 Start / Stop Minecraft server via AWS EC2 + SSM
- 📊 Live status dashboard (auto-refresh every 30s)
- 🌙 Dark / Light / System theme
- 📣 Discord audit log webhook
- 📱 Fully responsive (mobile, tablet, desktop)

---

## Local Setup

### 1. Clone

```bash
git clone https://github.com/your-username/minecontrol.git
cd minecontrol
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in all required values (see below).

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | ✅ | IAM access key with EC2 + SSM permissions |
| `AWS_SECRET_ACCESS_KEY` | ✅ | IAM secret key |
| `INSTANCE_ID` | ✅ | EC2 instance ID (e.g. `i-0abc123def456`) |
| `AWS_REGION` | ✅ | AWS region (e.g. `ap-south-1`) |
| `DISCORD_CLIENT_ID` | ✅ | Discord OAuth application client ID |
| `DISCORD_CLIENT_SECRET` | ✅ | Discord OAuth application client secret |
| `NEXTAUTH_SECRET` | ✅ | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | Full URL of the deployment (e.g. `https://your-app.vercel.app`) |
| `DISCORD_WEBHOOK_URL` | ✅ | Discord webhook for audit logs |

> **Security**: Never commit `.env` to version control. It is listed in `.gitignore`.

---

## Discord OAuth Setup

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create a new application
3. Go to **OAuth2 → General**
4. Add redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://your-app.vercel.app/api/auth/callback/discord`
5. Copy **Client ID** and **Client Secret** to `.env`

---

## User Allowlist

Edit `config.json` to add authorized Discord user IDs:

```json
{
  "permissions": {
    "authorized_users": [
      "123456789012345678"
    ]
  }
}
```

Find your Discord user ID: Settings → Advanced → Enable Developer Mode → right-click your name → Copy ID.

---

## Deployment on Vercel

### 1. Connect repository

- Go to [vercel.com](https://vercel.com) → New Project
- Import your GitHub repository
- Framework preset: **Next.js**

### 2. Add environment variables

In Vercel dashboard → Project → Settings → Environment Variables, add all required variables from the table above.

> Set `NEXTAUTH_URL` to your production URL (e.g. `https://minecontrol.vercel.app`).

### 3. Deploy

Click **Deploy**. Vercel handles build and hosting automatically.

### 4. Update Discord OAuth redirect

Add your production URL to Discord OAuth redirect URIs:

```
https://your-app.vercel.app/api/auth/callback/discord
```

---

## AWS IAM Permissions

The IAM user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ssm:DescribeInstanceInformation"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## API Endpoints

All endpoints require authentication.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Query EC2 and Minecraft status |
| `POST` | `/api/start` | Start EC2 and Minecraft server |
| `POST` | `/api/stop` | Stop Minecraft and EC2 instance |

### Response format

```json
{ "success": true, "status": "online", "message": "Server started successfully." }
{ "success": false, "error": "Failed to start server." }
```

---

## Tech Stack

- [Next.js 15](https://nextjs.org) — App Router
- [NextAuth.js](https://authjs.dev) — Discord OAuth
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/) — EC2 + SSM
- [SWR](https://swr.vercel.app) — Data fetching
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [shadcn/ui](https://ui.shadcn.com) — Component library
- [next-themes](https://github.com/pacocoursey/next-themes) — Theme system