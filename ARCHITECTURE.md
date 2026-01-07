# Start.gg → HubSpot Email Sync MVP

## Definitive Technical Architecture — HubSpot Marketplace + Tournament Admin Use Case

---

## 1. Objective

Provide a HubSpot Marketplace app that allows tournament administrators on Start.gg to manually sync participant emails into HubSpot Contacts.

### Scope

- HubSpot Marketplace app with OAuth installation
- Manual sync triggered by user
- Email-only field
- No persistent participant storage beyond OAuth tokens
- Minimal UI embedded in HubSpot

---

## 2. Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | React + TypeScript | Embedded HubSpot app UI for OAuth flows, tournament selection, and sync status |
| Backend | Node.js + Express | API endpoints for orchestrating Start.gg & HubSpot calls, token refresh, batching logic |
| Database / Token Storage | Supabase (Postgres) | Secure storage of OAuth tokens for Start.gg and HubSpot accounts |
| Deployment | Railway | Host backend (Node.js + Express), manage environment variables and secrets |
| HTTP Client | Axios | Perform REST API calls to HubSpot Contacts API |
| GraphQL Client | graphql-request | Query Start.gg GraphQL API for tournaments and participants |
| Authentication | JWT stored in HttpOnly cookies | Authenticate HubSpot-embedded frontend sessions to backend |
| Logging | Winston | Log backend events, errors, and sync results |

---

## 3. HubSpot Marketplace App Requirements

### App Architecture

- **Embedded App Model**: HubSpot Marketplace apps are embedded within the HubSpot interface using an iframe
- **App URL**: Must be configured in HubSpot Developer Portal - this is where HubSpot loads your React frontend
- **HTTPS Requirement**: App URL must use HTTPS in production (HubSpot security requirement)
- **CORS Configuration**: Frontend must allow requests from HubSpot's domain for embedded context

### OAuth Installation Flow

- Must support OAuth 2.0 installation for HubSpot accounts
- App must request scopes:
  - `crm.objects.contacts.read`
  - `crm.objects.contacts.write`
- Installation process:
  1. User installs app from HubSpot Marketplace
  2. HubSpot redirects to OAuth authorization page
  3. User grants requested permissions
  4. HubSpot redirects to configured callback URL with:
     - Authorization code
     - Hub ID (unique identifier for the HubSpot account)
  5. Backend exchanges authorization code for access and refresh tokens
  6. Tokens stored in Supabase and linked to Hub ID
  7. App becomes accessible within HubSpot interface

### Embedded App Context

- **Hub ID Access**: Hub ID is provided via URL parameters or HubSpot's Context API when app loads in iframe
- **Context API**: HubSpot provides JavaScript SDK to access installation context (hub_id, user info, etc.)
- **PostMessage Communication**: HubSpot and embedded app can communicate securely via postMessage API
- **Design Guidelines**: App UI should follow HubSpot design guidelines for consistent user experience

### Marketplace Listing Requirements

- **App Listing**: Must create listing in HubSpot Developer Portal with:
  - App name, description, company information
  - App icon (800x800 pixels)
  - Demo video and screenshots
  - Pricing information
  - Support contact details
- **Setup Guide**: Must provide publicly accessible setup guide (not behind paywall)
- **Minimum Installations**: Requires at least 3 active installations in different HubSpot accounts before marketplace approval
- **Review Process**: HubSpot Ecosystem Quality team reviews app (typically 10 business days)

---

## 4. Start.gg OAuth

### Scopes Required for Admin Access

- `user.identity`
- `user.email`
- `tournament.manager`

**Purpose:** Fetch tournaments managed by the authenticated user and retrieve participant emails

### OAuth Flow

1. Redirect user to Start.gg authorization page
2. Exchange authorization code for access + refresh tokens
3. Store tokens in Supabase linked to HubSpot account
4. Only tournament admins can sync participants using this flow

---

## 5. Core Workflow

```
[HubSpot Embedded React App]
   ↓
1. Install HubSpot Marketplace App
   ↓
2. HubSpot OAuth: request crm.objects.contacts.read/write
   ↓
3. Connect Start.gg Account: OAuth (user.identity + user.email + tournament.manager)
   ↓
4. Fetch tournaments managed by the authenticated user
   ↓
5. User selects event/tournament
   ↓
6. Click "Sync Participants"
   ↓
7. Backend (Railway):
      • Fetch participants via Start.gg GraphQL (paginated)
      • Extract emails, deduplicate
      • Batch upsert into HubSpot Contacts
   ↓
8. Return sync summary to embedded UI
```

---

## 6. Backend Endpoints

### 6.1 GET /startgg/tournaments

**Purpose:** List tournaments user can manage

**Process:**

1. Retrieve Start.gg token from Supabase
2. Query GraphQL:

```graphql
query ListManagedTournaments {
  currentUser {
    tournaments(query: {perPage: 50}) {
      nodes { id name slug }
    }
  }
}
```

3. Return tournament list to frontend

### 6.2 POST /sync/startgg

**Purpose:** Sync participants' emails to HubSpot

**Process:**

1. Retrieve Start.gg + HubSpot tokens
2. Refresh tokens if expired
3. Fetch participants via paginated GraphQL query:

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

4. Extract and deduplicate emails
5. Batch ≤100 emails
6. Upsert into HubSpot:

```json
{
  "idProperty": "email",
  "inputs": [
    { "id": "participant@example.com", "properties": { "email": "participant@example.com" } }
  ]
}
```

7. Return sync summary (synced, skipped, errors)

---

## 7. Supabase Schema

### hubspot_accounts

| Field | Type | Purpose |
|-------|------|---------|
| hub_id | string | HubSpot account ID |
| access_token | string | OAuth token |
| refresh_token | string | OAuth refresh token |
| expires_at | timestamp | Token expiration |

### startgg_accounts

| Field | Type | Purpose |
|-------|------|---------|
| startgg_user_id | string | Start.gg user ID |
| access_token | string | OAuth token |
| refresh_token | string | OAuth refresh token |
| expires_at | timestamp | Token expiration |

**Note:** No participant data persisted; only OAuth tokens.

---

## 8. Frontend Implementation

- **Stack:** React + TypeScript embedded in HubSpot Marketplace App

### Embedded App Considerations

- **Iframe Context**: App runs inside HubSpot iframe - must handle cross-origin communication
- **Hub ID Extraction**: Extract hub_id from URL parameters or HubSpot Context API on app load
- **HubSpot SDK**: May use `@hubspot/api-client` or HubSpot's JavaScript SDK to access context
- **Responsive Design**: UI must work within iframe constraints and HubSpot's layout
- **HTTPS Requirement**: Frontend must be served over HTTPS in production

### UI Components

- HubSpot OAuth install (handled automatically during marketplace installation)
- Start.gg connect button
- Tournament selection dropdown
- Sync button + progress indicator
- Sync result summary (synced/skipped/failed)

### Communication

- **Backend API**: Axios POST/GET to Railway backend
- **Session Management**: JWT stored in HttpOnly cookies (sent automatically with credentials)
- **Hub ID Context**: Pass hub_id to backend for token lookup (extracted from HubSpot context)
- **Error Handling**: Display user-friendly error messages for API failures

---

## 9. Deployment

### Backend Deployment

- **Platform:** Railway Node.js + Express
- **Environment Variables:** Railway secrets for HubSpot & Start.gg client IDs/secrets, Supabase credentials
- **HTTPS:** Railway provides automatic HTTPS for backend API
- **OAuth Redirect URIs:** Must be updated to production Railway URL in both HubSpot and Start.gg

### Frontend Deployment

- **Options:**
  - **HubSpot Hosting**: HubSpot can host embedded apps (configure App URL in Developer Portal)
  - **Railway**: Deploy as separate service with static file serving
  - **Static Hosting**: Deploy to Vercel, Netlify, AWS S3+CloudFront, etc.
- **HTTPS Requirement:** Frontend must use HTTPS in production (required for HubSpot iframe embedding)
- **CORS Configuration:** Backend must allow requests from frontend domain
- **App URL Configuration:** Update App URL in HubSpot Developer Portal to point to production frontend

### Environment Management

- **Development vs Production:** Use separate OAuth applications and Supabase projects for each environment
- **Secrets Management:** Never commit secrets to version control, use Railway's environment variable management
- **Configuration:** All environment-specific values (URLs, OAuth credentials) must be configured per environment

---

## 10. Error Handling & Logging

- **Backend:** Winston logging
- **Start.gg:** Handle 403 (unauthorized), missing emails, rate limits
- **HubSpot:** Handle batch upsert errors, token expiration
- **UI:** Display detailed sync summary

---

## 11. Rate Limiting & Pagination

- **Start.gg:** Handle pagination automatically for large tournaments
- **HubSpot:** Batch ≤100 emails per request
- **Retries:** Exponential backoff on rate limit errors

---

## 12. Privacy & Security

- Only emails for tournaments the admin manages are synced
- No participant data is stored persistently
- Tokens stored securely in Supabase
- OAuth scopes limited to minimum required (`user.identity`, `user.email`, `tournament.manager`)

---

## 13. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Missing participant emails | Skip nulls, report in summary |
| Large tournaments | Paginated GraphQL queries + batch upsert |
| Token expiration | Implement refresh logic for both Start.gg and HubSpot |
| API rate limits | Retry/backoff logic |
| Revoked admin access | Handle 403 gracefully and notify user |

---

## 14. Feasibility Verdict

Fully feasible using the selected stack:

- Frontend: React embedded in HubSpot Marketplace
- Backend: Node.js + Express on Railway
- Token Storage: Supabase
- Start.gg GraphQL API with `user.identity`, `user.email`, `tournament.manager` scopes
- HubSpot Contacts API batch upsert
- Manual sync only, email-only MVP ensures fast, low-complexity implementation

