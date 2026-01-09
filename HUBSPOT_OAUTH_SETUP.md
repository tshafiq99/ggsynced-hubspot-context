# HubSpot OAuth Setup Guide

This guide walks you through setting up HubSpot OAuth for the Start.gg → HubSpot Email Sync app.

## Prerequisites

- A HubSpot account (free tier works)
- Access to HubSpot Developer Portal
- Your Railway backend URL (or localhost for development)

---

## Step 1: Access HubSpot Developer Portal

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com)
2. Sign in with your HubSpot account
3. If you don't have a HubSpot account, create one at [hubspot.com](https://hubspot.com) (free tier is sufficient)

---

## Step 2: Create a New App

1. In the Developer Portal, click **"Create app"** or go to **"My apps"** → **"Create app"**
2. Fill in the app details:
   - **App name**: `Start.gg Email Sync` (or any name you prefer)
   - **Description**: `Sync participant emails from Start.gg tournaments to HubSpot Contacts`
   - **App logo**: Optional (you can skip this)
3. Click **"Create app"**

---

## Step 3: Configure OAuth Settings

1. In your app dashboard, navigate to **"Auth"** in the left sidebar
2. You'll see the **OAuth** section

### 3.1 Set Redirect URI

1. Scroll to **"Redirect URLs"** section
2. Click **"Add redirect URL"**
3. Enter your callback URL:
   - **For production**: `https://your-railway-app.railway.app/auth/hubspot/callback`
   - **For local development**: `http://localhost:3000/auth/hubspot/callback`
4. Click **"Create"**
5. **Important**: You can add multiple redirect URIs (one for production, one for local dev)

**Note**: The redirect URI must match exactly, including:
- Protocol (http vs https)
- Domain
- Port (if using non-standard port)
- Path (`/auth/hubspot/callback`)
- No trailing slashes

### 3.2 Configure Scopes

1. Scroll to **"Scopes"** section
2. Click **"Show scopes"** or **"Add scopes"**
3. Search for and select these scopes:
   - ✅ `crm.objects.contacts.read` - Read contacts
   - ✅ `crm.objects.contacts.write` - Create/update contacts
4. Click **"Save"** or **"Update scopes"**

**Required Scopes:**
- `crm.objects.contacts.read` - Required to read HubSpot contacts
- `crm.objects.contacts.write` - Required to create/update contacts

---

## Step 4: Get Your OAuth Credentials

1. Still in the **"Auth"** section, you'll see:
   - **Client ID** - This is your public OAuth client ID
   - **Client Secret** - This is your private OAuth client secret (keep this secure!)

2. **Copy both values** and save them securely:
   - Client ID will be used in frontend (safe to expose)
   - Client Secret will be used in backend only (never expose publicly)

---

## Step 5: Configure Environment Variables

### Frontend (Netlify or `.env.local`)

Add to your environment variables:

```env
VITE_HUBSPOT_CLIENT_ID=your_client_id_here
```

**Note**: Only the Client ID goes in the frontend. The Client Secret stays in the backend.

### Backend (Railway)

Add to your Railway environment variables:

```env
HUBSPOT_CLIENT_ID=your_client_id_here
HUBSPOT_CLIENT_SECRET=your_client_secret_here
```

---

## Step 6: Verify Redirect URI Configuration

### For Production

1. Make sure your Railway backend is deployed
2. Get your Railway deployment URL (e.g., `https://my-app.railway.app`)
3. In HubSpot app settings, ensure redirect URI is:
   ```
   https://my-app.railway.app/auth/hubspot/callback
   ```

### For Local Development

1. Make sure your backend runs on `http://localhost:3000`
2. In HubSpot app settings, add redirect URI:
   ```
   http://localhost:3000/auth/hubspot/callback
   ```

**Important**: You can have both production and localhost redirect URIs configured simultaneously.

---

## Step 7: Test the OAuth Flow

### 7.1 Test Frontend Redirect

1. Start your frontend: `npm run dev`
2. Click the "Connect HubSpot" button
3. You should be redirected to HubSpot's authorization page
4. If you see an error about redirect URI mismatch, double-check the URI in HubSpot app settings

### 7.2 Test Authorization

1. On the HubSpot authorization page, review the requested permissions
2. Click **"Grant access"** or **"Allow"**
3. You should be redirected back to your app (via the backend callback)
4. The backend should exchange the authorization code for tokens

### 7.3 Verify Token Storage

1. Check your Supabase database
2. Query the `ggsynced.hubspot_accounts` table
3. You should see a new row with:
   - `user_id` (from session)
   - `access_token`
   - `refresh_token`
   - `expires_at`

---

## Step 8: Troubleshooting

### Error: "Redirect URI mismatch"

**Problem**: The redirect URI in your app doesn't match what's configured in HubSpot.

**Solution**:
1. Check the exact redirect URI in HubSpot app settings
2. Ensure it matches exactly (including protocol, domain, port, path)
3. Common issues:
   - Missing `https://` vs `http://`
   - Trailing slash: `/auth/hubspot/callback/` vs `/auth/hubspot/callback`
   - Wrong port number
   - Wrong domain

### Error: "Invalid client_id"

**Problem**: The Client ID is incorrect or not set.

**Solution**:
1. Verify `VITE_HUBSPOT_CLIENT_ID` is set in frontend environment
2. Copy the Client ID directly from HubSpot app settings
3. Rebuild/redeploy if using Netlify

### Error: "Invalid scope"

**Problem**: The requested scopes aren't configured in your HubSpot app.

**Solution**:
1. Go to HubSpot app → Auth → Scopes
2. Ensure `crm.objects.contacts.read` and `crm.objects.contacts.write` are selected
3. Save the changes

### Error: "Access denied" or "User cancelled"

**Problem**: User didn't authorize the app or cancelled the flow.

**Solution**: This is expected behavior. User can try again by clicking the connect button.

### Token Exchange Fails

**Problem**: Backend can't exchange authorization code for tokens.

**Solution**:
1. Verify `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET` are set in Railway
2. Check backend logs for detailed error messages
3. Ensure backend is making POST request to `https://api.hubapi.com/oauth/v1/token`

---

## Step 9: Production Checklist

Before going to production:

- [ ] HubSpot app is configured with production redirect URI
- [ ] Client ID is set in Netlify environment variables
- [ ] Client ID and Secret are set in Railway environment variables
- [ ] Scopes are correctly configured in HubSpot app
- [ ] Tested OAuth flow end-to-end
- [ ] Verified tokens are stored in Supabase
- [ ] Backend can use access token to make HubSpot API calls

---

## Quick Reference

### HubSpot OAuth URLs

- **Authorization URL**: `https://app.hubspot.com/oauth/authorize`
- **Token Exchange URL**: `https://api.hubapi.com/oauth/v1/token`
- **API Base URL**: `https://api.hubapi.com`

### Required Scopes

```
crm.objects.contacts.read
crm.objects.contacts.write
```

### Redirect URI Format

```
https://your-backend-domain.com/auth/hubspot/callback
```

### Environment Variables

**Frontend:**
- `VITE_HUBSPOT_CLIENT_ID` - Client ID (public, safe to expose)

**Backend:**
- `HUBSPOT_CLIENT_ID` - Client ID
- `HUBSPOT_CLIENT_SECRET` - Client Secret (private, never expose)

---

## Additional Resources

- [HubSpot OAuth Documentation](https://developers.hubspot.com/docs/api/working-with-oauth)
- [HubSpot Contacts API](https://developers.hubspot.com/docs/api/crm/contacts)
- [HubSpot Developer Portal](https://developers.hubspot.com)

---

## Next Steps

After setting up HubSpot OAuth:

1. Set up Start.gg OAuth (similar process)
2. Test the full sync workflow
3. Deploy to production
4. Monitor token refresh functionality
