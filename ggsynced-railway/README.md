# GGSynced Railway Backend

Backend API for syncing participant emails from Start.gg tournaments to HubSpot Contacts.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Set environment variables (see `.env.example` for required variables)

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Environment Variables

- `HUBSPOT_CLIENT_ID` - HubSpot OAuth client ID
- `HUBSPOT_CLIENT_SECRET` - HubSpot OAuth client secret
- `STARTGG_CLIENT_ID` - Start.gg OAuth client ID
- `STARTGG_CLIENT_SECRET` - Start.gg OAuth client secret
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_SCHEMA` - Database schema name (default: `ggsynced`)
- `FRONTEND_URL` - Frontend URL for CORS and redirects
- `PORT` - Server port (default: 3000)

## API Endpoints

### OAuth
- `GET /auth/hubspot/callback` - HubSpot OAuth callback
- `GET /auth/startgg/callback` - Start.gg OAuth callback

### Start.gg
- `GET /startgg/tournaments` - List tournaments
- `GET /startgg/tournaments/:slug/participants` - List participants

### HubSpot
- `GET /hubspot/columns` - List HubSpot contact properties

### Sync
- `POST /sync` - Sync emails to HubSpot

## Deployment to Railway

1. Push code to GitHub
2. Connect repository to Railway
3. Set environment variables in Railway dashboard
4. Deploy

See [RAILWAY_SETUP.md](../RAILWAY_SETUP.md) for detailed instructions.

## Architecture

See [ARCHITECTURE.md](../ARCHITECTURE.md) for full architecture documentation.
