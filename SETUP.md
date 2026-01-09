# Setup Guide

This guide walks you through setting up all components needed to run the Start.gg → HubSpot Email Sync app.

## Prerequisites

- Node.js 18+ installed
- Accounts for:
  - [Netlify](https://netlify.com) (frontend hosting)
  - [Railway](https://railway.app) (backend hosting)
  - [Supabase](https://supabase.com) (database)
  - [HubSpot](https://hubspot.com) (OAuth app)
  - [Start.gg](https://start.gg) (OAuth app)

---

## 1. Database Setup (Supabase)

### Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Note your project URL and anon key (Settings → API)

### Create Database Tables

**Important**: Tables should be created in the `ggsynced` schema.

Run these SQL commands in Supabase SQL Editor:

```sql
-- Set schema context
SET search_path TO ggsynced;

-- HubSpot OAuth tokens table
CREATE TABLE ggsynced.hubspot_accounts (
  user_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Start.gg OAuth tokens table
CREATE TABLE ggsynced.startgg_accounts (
  user_id TEXT PRIMARY KEY,
  startgg_user_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_hubspot_user_id ON ggsynced.hubspot_accounts(user_id);
CREATE INDEX idx_startgg_user_id ON ggsynced.startgg_accounts(user_id);
```

**Note**: If the `ggsynced` schema doesn't exist, create it first:
```sql
CREATE SCHEMA IF NOT EXISTS ggsynced;
```

### Get Supabase Credentials

- **Project URL**: `https://your-project.supabase.co`
- **Anon Key**: Found in Settings → API
- **Service Role Key**: Found in Settings → API (for backend use)

---

## 2. OAuth App Setup

### HubSpot OAuth App

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com)
2. Create a new app
3. Configure OAuth:
   - **Redirect URI**: `https://your-railway-app.railway.app/auth/hubspot/callback`
   - **Scopes**: 
     - `crm.objects.contacts.read`
     - `crm.objects.contacts.write`
4. Note your **Client ID** and **Client Secret**

### Start.gg OAuth App

1. Go to [Start.gg Developer Portal](https://www.start.gg/admin/developer)
2. Create a new OAuth application
3. Configure OAuth:
   - **Redirect URI**: `https://your-railway-app.railway.app/auth/startgg/callback`
   - **Scopes**:
     - `user.identity`
     - `user.email`
     - `tournament.manager`
4. Note your **Client ID** and **Client Secret**

---

## 3. Backend Setup (Railway)

### Create Railway Project

1. Go to [Railway Dashboard](https://railway.app)
2. Create a new project
3. Deploy from GitHub (or create a new service)

### Backend Code Structure

You'll need to create a Node.js + Express backend with these endpoints:

- `GET /auth/hubspot/callback` - HubSpot OAuth callback
- `GET /auth/startgg/callback` - Start.gg OAuth callback
- `GET /startgg/tournaments` - List tournaments
- `GET /startgg/tournaments/:slug/participants` - List participants
- `GET /hubspot/columns` - List HubSpot columns
- `POST /sync` - Sync emails to HubSpot

**Note**: The backend code is not included in this repository. You'll need to create it separately.

### Railway Environment Variables

Set these in Railway project settings:

```
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
STARTGG_CLIENT_ID=your_startgg_client_id
STARTGG_CLIENT_SECRET=your_startgg_client_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_SCHEMA=ggsynced
FRONTEND_URL=https://your-netlify-app.netlify.app
```

**Note**: The `SUPABASE_SCHEMA` variable should be set to `ggsynced` to use the correct schema. When connecting to Supabase from your backend, ensure you're querying tables in the `ggsynced` schema (e.g., `ggsynced.hubspot_accounts`, `ggsynced.startgg_accounts`).

### Update OAuth Redirect URIs

After deploying to Railway, update your OAuth apps with the actual Railway URL:
- HubSpot: `https://your-railway-app.railway.app/auth/hubspot/callback`
- Start.gg: `https://your-railway-app.railway.app/auth/startgg/callback`

---

## 4. Frontend Setup (Netlify)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
VITE_API_URL=http://localhost:3000
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id
VITE_STARTGG_CLIENT_ID=your_startgg_client_id
```

3. Run development server:
```bash
npm run dev
```

### Deploy to Netlify

1. Push code to GitHub
2. Go to [Netlify Dashboard](https://app.netlify.com)
3. Add new site from Git
4. Select your repository
5. Build settings (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `dist`

### Netlify Environment Variables

Set these in Netlify site settings → Environment variables:

```
VITE_API_URL=https://your-railway-app.railway.app
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id
VITE_STARTGG_CLIENT_ID=your_startgg_client_id
```

**Important**: After setting environment variables, trigger a new deploy.

---

## 5. Testing the Setup

### 1. Test Frontend

1. Visit your Netlify URL
2. Verify the app loads correctly
3. Check browser console for errors

### 2. Test OAuth Flow

1. Click "Connect HubSpot" button
2. Should redirect to HubSpot authorization
3. After authorization, should redirect back to app
4. Repeat for Start.gg

### 3. Test API Endpoints

Use curl or Postman to test backend endpoints:

```bash
# Test tournaments endpoint (requires Start.gg connection)
curl -H "X-Session-Id: test-session" \
  https://your-railway-app.railway.app/startgg/tournaments

# Test HubSpot columns (requires HubSpot connection)
curl -H "X-Session-Id: test-session" \
  https://your-railway-app.railway.app/hubspot/columns
```

---

## 6. Troubleshooting

### Frontend Issues

- **CORS errors**: Ensure Railway backend has CORS configured for your Netlify domain
- **Environment variables not working**: Rebuild Netlify site after adding env vars
- **OAuth redirect fails**: Check redirect URIs match exactly in OAuth app settings

### Backend Issues

- **Database connection fails**: Verify Supabase credentials and network access
- **OAuth token exchange fails**: Check client ID/secret are correct
- **Session not found**: Ensure `X-Session-Id` header is sent with requests

### OAuth Issues

- **Redirect URI mismatch**: Must match exactly (including http/https, trailing slashes)
- **Scope errors**: Ensure all required scopes are requested
- **Token expired**: Backend should handle refresh automatically

---

## 7. Security Checklist

- [ ] OAuth client secrets stored securely (never in frontend)
- [ ] Supabase service role key only in backend
- [ ] HTTPS enabled on all services
- [ ] CORS configured properly
- [ ] Session IDs are unique and not predictable
- [ ] Environment variables not committed to Git

---

## 8. Next Steps

1. Create the backend API (see ARCHITECTURE.md for endpoint specifications)
2. Test OAuth flows end-to-end
3. Test sync functionality with a small tournament
4. Monitor error logs in Railway and Netlify
5. Set up error tracking (optional: Sentry, LogRocket, etc.)

---

## Quick Reference

### Environment Variables Summary

**Frontend (Netlify)**:
- `VITE_API_URL` - Railway backend URL
- `VITE_HUBSPOT_CLIENT_ID` - HubSpot OAuth client ID
- `VITE_STARTGG_CLIENT_ID` - Start.gg OAuth client ID

**Backend (Railway)**:
- `HUBSPOT_CLIENT_ID` - HubSpot OAuth client ID
- `HUBSPOT_CLIENT_SECRET` - HubSpot OAuth client secret
- `STARTGG_CLIENT_ID` - Start.gg OAuth client ID
- `STARTGG_CLIENT_SECRET` - Start.gg OAuth client secret
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_SCHEMA` - Supabase schema name (set to `ggsynced`)
- `FRONTEND_URL` - Netlify frontend URL (for redirects)

### OAuth Redirect URIs

- HubSpot: `https://your-railway-app.railway.app/auth/hubspot/callback`
- Start.gg: `https://your-railway-app.railway.app/auth/startgg/callback`
