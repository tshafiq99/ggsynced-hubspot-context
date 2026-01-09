# Quick Start Checklist

Use this checklist to quickly set up the app. See SETUP.md for detailed instructions.

## ✅ Setup Checklist

### 1. Database (Supabase)
- [ ] Create Supabase project
- [ ] Create `ggsynced` schema (if it doesn't exist)
- [ ] Run SQL to create `hubspot_accounts` and `startgg_accounts` tables in `ggsynced` schema
- [ ] Save Supabase URL and Service Role Key

### 2. OAuth Apps
- [ ] Create HubSpot OAuth app
  - [ ] Set redirect URI: `https://your-railway-app.railway.app/auth/hubspot/callback`
  - [ ] Save Client ID and Client Secret
- [ ] Create Start.gg OAuth app
  - [ ] Set redirect URI: `https://your-railway-app.railway.app/auth/startgg/callback`
  - [ ] Save Client ID and Client Secret

### 3. Backend (Railway)
- [ ] Create Railway project
- [ ] Deploy backend code (not included in this repo)
- [ ] Set environment variables:
  - [ ] `HUBSPOT_CLIENT_ID`
  - [ ] `HUBSPOT_CLIENT_SECRET`
  - [ ] `STARTGG_CLIENT_ID`
  - [ ] `STARTGG_CLIENT_SECRET`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_SCHEMA` (set to `ggsynced`)
  - [ ] `FRONTEND_URL`
- [ ] Note Railway deployment URL

### 4. Frontend (Netlify)
- [ ] Push code to GitHub
- [ ] Connect repository to Netlify
- [ ] Set environment variables:
  - [ ] `VITE_API_URL` (Railway URL)
  - [ ] `VITE_HUBSPOT_CLIENT_ID`
  - [ ] `VITE_STARTGG_CLIENT_ID`
- [ ] Deploy site

### 5. Update OAuth Redirect URIs
- [ ] Update HubSpot OAuth app with actual Railway URL
- [ ] Update Start.gg OAuth app with actual Railway URL

### 6. Test
- [ ] Visit Netlify URL
- [ ] Test HubSpot OAuth connection
- [ ] Test Start.gg OAuth connection
- [ ] Test tournament listing
- [ ] Test sync functionality

---

## 🔑 Required Values

Before starting, gather these values:

1. **Supabase**
   - Project URL
   - Service Role Key

2. **HubSpot OAuth**
   - Client ID
   - Client Secret

3. **Start.gg OAuth**
   - Client ID
   - Client Secret

4. **Railway** (after deployment)
   - Deployment URL

5. **Netlify** (after deployment)
   - Site URL

---

## 📝 Local Development

1. Create `.env.local`:
```env
VITE_API_URL=http://localhost:3000
VITE_HUBSPOT_CLIENT_ID=your_client_id
VITE_STARTGG_CLIENT_ID=your_client_id
```

2. Install and run:
```bash
npm install
npm run dev
```

---

## ⚠️ Important Notes

- Backend code must be created separately (see ARCHITECTURE.md)
- Tables must be created in the `ggsynced` schema (not `public`)
- Backend must query tables using schema-qualified names (e.g., `ggsynced.hubspot_accounts`)
- OAuth redirect URIs must match exactly
- Environment variables must be set before deployment
- Frontend can use client IDs (safe to expose)
- Backend must use client secrets (never expose)
