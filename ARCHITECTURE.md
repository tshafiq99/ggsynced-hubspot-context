# Start.gg → HubSpot Email Sync

## 1. Objective

Sync participant emails from Start.gg tournaments to HubSpot Contacts via a one-time manual sync.

---

## 2. Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | TypeScript | Web app deployed on Netlify |
| Backend API | Node.js + Express | API endpoints on Railway |
| Database | Supabase (Postgres) | OAuth token storage |
| HTTP Client | Native fetch API | REST API calls to HubSpot Contacts API |
| GraphQL Client | graphql-request | Query Start.gg GraphQL API |

---

## 3. OAuth Setup

### HubSpot OAuth

- **Scopes Required:**
  - `crm.objects.contacts.read`
  - `crm.objects.contacts.write`
- **Flow:**
  1. Frontend redirects user to HubSpot authorization page
  2. User authorizes and grants permissions
  3. HubSpot redirects to Railway callback URL with authorization code
  4. Railway backend exchanges authorization code for tokens using:
     - Client ID (stored in Railway env vars)
     - Client Secret (stored in Railway env vars)
  5. Access token + refresh token stored in Supabase
  6. Railway uses access token for subsequent HubSpot API calls
  7. When token expires, Railway uses refresh token to get new access token

### Start.gg OAuth

- **Scopes Required:**
  - `user.identity`
  - `user.email`
  - `tournament.manager`
- **Flow:**
  1. Frontend redirects user to Start.gg authorization page
  2. User authorizes and grants permissions
  3. Start.gg redirects to Railway callback URL with authorization code
  4. Railway backend exchanges authorization code for tokens using:
     - Client ID (stored in Railway env vars)
     - Client Secret (stored in Railway env vars)
  5. Access token + refresh token stored in Supabase
  6. Railway uses access token for subsequent Start.gg GraphQL API calls
  7. When token expires, Railway uses refresh token to get new access token

### Authentication Credentials

- **Railway Environment Variables:**
  - `HUBSPOT_CLIENT_ID` - HubSpot OAuth app client ID
  - `HUBSPOT_CLIENT_SECRET` - HubSpot OAuth app client secret
  - `STARTGG_CLIENT_ID` - Start.gg OAuth app client ID
  - `STARTGG_CLIENT_SECRET` - Start.gg OAuth app client secret
- **Token Exchange:** Railway uses client ID + secret to exchange authorization codes for access/refresh tokens
- **API Calls:** Railway uses stored access tokens (from Supabase) to authenticate API requests to HubSpot and Start.gg

---

## 4. Core Workflow

```
[TypeScript Frontend on Netlify]
   ↓
1. User connects HubSpot account (OAuth)
   ↓
2. User connects Start.gg account (OAuth)
   ↓
3. Fetch tournaments where user is admin
   ↓
4. Display tournaments with participants
   ↓
5. Display HubSpot Contact columns
   ↓
6. User clicks "Sync" button
   ↓
7. Backend (Railway):
      • Fetch participant emails via Start.gg GraphQL
      • Batch upsert emails into HubSpot Contacts
   ↓
8. Display sync summary
```

---

## 5. Backend Endpoints

### GET /auth/hubspot/callback

**Purpose:** Handle HubSpot OAuth callback

**Process:**
1. Receive authorization code from HubSpot redirect
2. Exchange code for access + refresh tokens using client ID/secret
3. Store tokens in Supabase linked to user session
4. Redirect user back to frontend

### GET /auth/startgg/callback

**Purpose:** Handle Start.gg OAuth callback

**Process:**
1. Receive authorization code from Start.gg redirect
2. Exchange code for access + refresh tokens using client ID/secret
3. Store tokens in Supabase linked to user session
4. Redirect user back to frontend

### GET /startgg/tournaments

**Purpose:** List tournaments where user is admin

**Process:**
1. Retrieve Start.gg access token from Supabase (using user session)
2. Use access token to authenticate GraphQL request
3. Query GraphQL:
```graphql
query ListManagedTournaments {
  currentUser {
    tournaments(query: {perPage: 50}) {
      nodes { id name slug }
    }
  }
}
```
3. Return tournament list

### GET /startgg/tournaments/:slug/participants

**Purpose:** List participants for a tournament

**Process:**
1. Retrieve Start.gg access token from Supabase (using user session)
2. Use access token to authenticate GraphQL request
3. Query GraphQL (paginated):
```graphql
query FetchParticipants($slug: String!, $page: Int!) {
  event(slug: $slug) {
    entrants(query: {page: $page, perPage: 100}) {
      nodes { participant { user { email } } }
      pageInfo { totalPages }
    }
  }
}
```
3. Return participants with emails

### GET /hubspot/columns

**Purpose:** List HubSpot Contact properties/columns

**Process:**
1. Retrieve HubSpot access token from Supabase (using user session)
2. Use access token to authenticate HubSpot API request
3. Call HubSpot Properties API
4. Return available Contact properties

### POST /sync

**Purpose:** Sync participant emails to HubSpot

**Process:**
1. Retrieve Start.gg + HubSpot access tokens from Supabase (using user session)
2. Refresh tokens if expired (using refresh tokens stored in Supabase)
3. Use Start.gg access token to authenticate GraphQL requests
4. Fetch participant emails via Start.gg GraphQL (paginated)
5. Extract and deduplicate emails
6. Use HubSpot access token to authenticate API requests
7. Batch upsert into HubSpot (≤100 per request):
```json
{
  "idProperty": "email",
  "inputs": [
    { "id": "participant@example.com", "properties": { "email": "participant@example.com" } }
  ]
}
```
6. Return sync summary (synced, skipped, errors)

---

## 6. Supabase Schema

### hubspot_accounts

| Field | Type | Purpose |
|-------|------|---------|
| user_id | string | User identifier (session-based) |
| access_token | string | OAuth access token |
| refresh_token | string | OAuth refresh token |
| expires_at | timestamp | Token expiration |

### startgg_accounts

| Field | Type | Purpose |
|-------|------|---------|
| user_id | string | User identifier (session-based) |
| startgg_user_id | string | Start.gg user ID |
| access_token | string | OAuth access token |
| refresh_token | string | OAuth refresh token |
| expires_at | timestamp | Token expiration |

**Note:** Only OAuth tokens stored; no participant data persisted.

---

## 7. Frontend Implementation

### Stack
- TypeScript
- Deployed on Netlify

### UI Components
- HubSpot OAuth connect button
- Start.gg OAuth connect button
- Tournament list (where user is admin)
- Participant list with emails
- HubSpot Contact columns display
- Sync button
- Sync result summary

### Communication
- Backend API: HTTP requests to Railway backend
- Session Management: Simple session/user identifier for token lookup
- Error Handling: Display user-friendly error messages

---

## 8. Deployment

### Frontend
- **Platform:** Netlify
- **HTTPS:** Automatic via Netlify
- **Environment Variables:** OAuth client IDs, API URLs

### Backend
- **Platform:** Railway (Node.js + Express)
- **Environment Variables:** HubSpot & Start.gg client IDs/secrets, Supabase credentials
- **HTTPS:** Automatic via Railway
- **OAuth Redirect URIs:** Configured to Railway URL

### Database
- **Platform:** Supabase
- **Access:** Backend connects via Supabase client

---

## 9. Error Handling

- **Start.gg:** Handle 403 (unauthorized), missing emails, rate limits
- **HubSpot:** Handle batch upsert errors, token expiration
- **UI:** Display sync summary with errors
- **Token Refresh:** Automatic refresh on expiration

---

## 10. Rate Limiting & Pagination

- **Start.gg:** Paginated GraphQL queries for large tournaments
- **HubSpot:** Batch ≤100 emails per request
- **Retries:** Exponential backoff on rate limit errors

---

## 11. Privacy & Security

- Only emails for tournaments where user is admin are synced
- No participant data stored persistently
- OAuth tokens stored securely in Supabase
- Minimal OAuth scopes required
