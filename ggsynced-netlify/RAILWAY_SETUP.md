# Railway Backend Setup Guide

This guide walks you through setting up your backend API on Railway for the Start.gg → HubSpot Email Sync app.

## Prerequisites

- A Railway account ([railway.app](https://railway.app))
- Backend code repository (Node.js + Express)
- Supabase credentials (from database setup)
- OAuth credentials (HubSpot and Start.gg Client IDs and Secrets)
- GitHub account (for GitHub deployment)

---

## Step 1: Create Railway Account

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with:
   - GitHub (recommended for easy deployment)
   - Email
   - Google
4. Complete the signup process

---

## Step 2: Create a New Project

1. In Railway dashboard, click **"New Project"**
2. Choose one of these options:

### Option A: Deploy from GitHub (Recommended)

1. Click **"Deploy from GitHub repo"**
2. Authorize Railway to access your GitHub account (if first time)
3. Select your backend repository
4. Railway will automatically detect it's a Node.js project
5. Click **"Deploy Now"**

### Option B: Create Empty Project

1. Click **"Empty Project"**
2. You'll add a service later

---

## Step 3: Configure Your Service

### 3.1 If Deployed from GitHub

Railway will automatically:
- Detect Node.js
- Install dependencies (`npm install`)
- Run build command (if specified in `package.json`)
- Start the service

### 3.2 If Starting Empty

1. Click **"New"** → **"GitHub Repo"** or **"Empty Service"**
2. For GitHub: Select your backend repository
3. Railway will auto-detect settings

### 3.3 Configure Build Settings

Railway usually auto-detects, but you can verify:

1. Go to your service → **Settings** → **Build**
2. Verify:
   - **Build Command**: `npm install` (or your custom build)
   - **Start Command**: `npm start` or `node server.js` (check your `package.json`)

**Example `package.json` scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## Step 4: Set Environment Variables

1. In your Railway service, go to **Variables** tab
2. Click **"New Variable"** for each:

### Required Environment Variables

Add these one by one:

```env
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
STARTGG_CLIENT_ID=your_startgg_client_id
STARTGG_CLIENT_SECRET=your_startgg_client_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_SCHEMA=ggsynced
FRONTEND_URL=https://your-netlify-app.netlify.app
```

### Environment Variable Details

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `HUBSPOT_CLIENT_ID` | HubSpot OAuth Client ID | HubSpot Developer Portal |
| `HUBSPOT_CLIENT_SECRET` | HubSpot OAuth Client Secret | HubSpot Developer Portal |
| `STARTGG_CLIENT_ID` | Start.gg OAuth Client ID | Start.gg Developer Portal |
| `STARTGG_CLIENT_SECRET` | Start.gg OAuth Client Secret | Start.gg Developer Portal |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `SUPABASE_SCHEMA` | Database schema name | Set to `ggsynced` |
| `FRONTEND_URL` | Netlify frontend URL | Your Netlify site URL |

**Important Notes:**
- Click **"Add"** after each variable
- Variables are case-sensitive
- No spaces around the `=` sign
- Values are encrypted and secure

---

## Step 5: Get Your Railway Deployment URL

1. In your Railway service, go to **Settings** → **Networking**
2. Under **"Public Networking"**, you'll see:
   - **Domain**: `your-app-name.up.railway.app` (auto-generated)
   - Or click **"Generate Domain"** if not visible

3. **Copy the full URL** (e.g., `https://your-app-name.up.railway.app`)

**This is your backend API URL!**

---

## Step 6: Update OAuth Redirect URIs

Now that you have your Railway URL, update your OAuth apps:

### HubSpot

1. Go to HubSpot Developer Portal → Your App → Auth
2. Add redirect URI: `https://your-app-name.up.railway.app/auth/hubspot/callback`
3. Save changes

### Start.gg

1. Go to Start.gg Developer Portal → Your App
2. Add redirect URI: `https://your-app-name.up.railway.app/auth/startgg/callback`
3. Save changes

---

## Step 7: Configure CORS

Your backend needs to allow requests from your Netlify frontend.

### Example Express CORS Configuration

```javascript
const cors = require('cors');
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-netlify-app.netlify.app',
  credentials: true
}));
```

**Important**: Use the `FRONTEND_URL` environment variable for the origin.

---

## Step 8: Verify Deployment

### 8.1 Check Deployment Status

1. In Railway, go to **Deployments** tab
2. You should see deployment logs
3. Look for:
   - ✅ "Build successful"
   - ✅ "Deployment successful"
   - ✅ Service is running

### 8.2 Check Service Health

1. Go to **Settings** → **Networking**
2. Click on your public domain
3. You should see your API response (or a 404 if no root route)

### 8.3 Test API Endpoints

Use curl or Postman to test:

```bash
# Test health endpoint (if you have one)
curl https://your-app-name.up.railway.app/

# Test with session header
curl -H "X-Session-Id: test-session" \
  https://your-app-name.up.railway.app/startgg/tournaments
```

---

## Step 9: Update Frontend Configuration

1. Go to your Netlify dashboard
2. Update environment variable:
   ```
   VITE_API_URL=https://your-app-name.up.railway.app
   ```
3. Redeploy Netlify site

---

## Step 10: Monitor Logs

### View Logs in Railway

1. In Railway service, go to **Deployments** tab
2. Click on a deployment
3. View **Build Logs** and **Deploy Logs**

### Real-time Logs

1. Click **"View Logs"** button in service dashboard
2. See real-time application logs
3. Useful for debugging

---

## Backend Code Structure

Your backend should have these endpoints (see ARCHITECTURE.md for details):

### Required Endpoints

```
GET  /auth/hubspot/callback     - HubSpot OAuth callback
GET  /auth/startgg/callback     - Start.gg OAuth callback
GET  /startgg/tournaments        - List tournaments
GET  /startgg/tournaments/:slug/participants - List participants
GET  /hubspot/columns            - List HubSpot columns
POST /sync                        - Sync emails to HubSpot
```

### Example Backend Structure

```
backend/
├── server.js          # Main Express server
├── package.json       # Dependencies
├── routes/
│   ├── auth.js        # OAuth routes
│   ├── startgg.js     # Start.gg routes
│   ├── hubspot.js     # HubSpot routes
│   └── sync.js        # Sync route
├── services/
│   ├── supabase.js    # Supabase client
│   ├── hubspot.js     # HubSpot API client
│   └── startgg.js     # Start.gg GraphQL client
└── utils/
    └── tokenRefresh.js # Token refresh logic
```

---

## Troubleshooting

### Deployment Fails

**Problem**: Build or deployment fails

**Solutions**:
1. Check build logs in Railway
2. Verify `package.json` has correct scripts
3. Ensure all dependencies are listed
4. Check Node.js version compatibility
5. Verify build command is correct

### Environment Variables Not Working

**Problem**: Backend can't access environment variables

**Solutions**:
1. Verify variables are set in Railway (not just locally)
2. Check variable names are exact (case-sensitive)
3. Redeploy after adding variables
4. Check backend code uses `process.env.VARIABLE_NAME`

### Service Won't Start

**Problem**: Service shows as "stopped" or crashes

**Solutions**:
1. Check logs for error messages
2. Verify start command in `package.json`
3. Ensure port is set correctly (Railway uses `PORT` env var)
4. Check for missing dependencies

**Example port configuration:**
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### CORS Errors

**Problem**: Frontend can't make requests to backend

**Solutions**:
1. Verify CORS is configured in backend
2. Check `FRONTEND_URL` is set correctly
3. Ensure origin matches exactly (including protocol)
4. Check CORS middleware is before routes

### Database Connection Fails

**Problem**: Can't connect to Supabase

**Solutions**:
1. Verify `SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Ensure Supabase allows connections from Railway
4. Verify schema name is `ggsynced`
5. Check network/firewall settings

### OAuth Callbacks Not Working

**Problem**: OAuth redirects fail

**Solutions**:
1. Verify redirect URIs in OAuth apps match Railway URL exactly
2. Check callback routes are implemented
3. Verify environment variables are set
4. Check logs for specific error messages

---

## Production Checklist

Before going live:

- [ ] All environment variables are set
- [ ] Railway service is running and healthy
- [ ] OAuth redirect URIs are updated with Railway URL
- [ ] CORS is configured for frontend domain
- [ ] Database connection is working
- [ ] All API endpoints are tested
- [ ] Error handling is implemented
- [ ] Logs are being monitored
- [ ] Frontend `VITE_API_URL` is updated

---

## Custom Domain (Optional)

Railway provides a free subdomain, but you can use a custom domain:

1. Go to **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Add your domain
4. Follow DNS configuration instructions
5. Update OAuth redirect URIs with custom domain

---

## Scaling and Performance

### Railway Free Tier

- 500 hours/month free
- $5 credit monthly
- Auto-scaling based on usage

### Monitoring

1. **Metrics**: View CPU, memory, network usage
2. **Logs**: Real-time and historical logs
3. **Deployments**: Track deployment history

### Upgrading

If you need more resources:
1. Go to Railway dashboard
2. Click **"Upgrade"**
3. Choose a plan based on needs

---

## Quick Reference

### Railway URLs

- **Dashboard**: [railway.app](https://railway.app)
- **Documentation**: [docs.railway.app](https://docs.railway.app)

### Important Commands

```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Login via CLI
railway login

# Link project
railway link

# View logs
railway logs

# Set environment variable
railway variables set KEY=value
```

### Environment Variables Template

```env
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
STARTGG_CLIENT_ID=
STARTGG_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_SCHEMA=ggsynced
FRONTEND_URL=
PORT=3000
```

---

## Next Steps

After Railway setup:

1. ✅ Test all API endpoints
2. ✅ Verify OAuth flows work
3. ✅ Test sync functionality
4. ✅ Monitor logs for errors
5. ✅ Set up error tracking (optional)

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Node.js on Railway](https://docs.railway.app/guides/nodejs)
