# Start.gg → HubSpot Email Sync MVP - Implementation Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Supabase Setup](#supabase-setup)
4. [HubSpot Marketplace App Setup](#hubspot-marketplace-app-setup)
5. [Start.gg OAuth Setup](#startgg-oauth-setup)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Implementation](#frontend-implementation)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

Before beginning development, ensure you have the following software installed on your development machine:

1. **Node.js** (version 18 or higher)
   - Node.js is the JavaScript runtime that will execute your backend server code
   - Verify installation by checking the version in your terminal
   - If not installed, download from the official Node.js website

2. **npm** (comes with Node.js)
   - npm is the package manager for Node.js that handles dependency installation
   - Verify it's working by checking its version

3. **Git**
   - Git is essential for version control and tracking changes to your codebase
   - Verify installation by checking the Git version

4. **Code Editor**
   - A modern code editor like VS Code is recommended for development
   - Provides syntax highlighting, debugging tools, and extensions

5. **HubSpot CLI**
   - The official command-line tool for building HubSpot Marketplace apps
   - Install globally using npm after Node.js is installed
   - Used for creating app projects, configuring OAuth, managing app settings, and local development
   - Must authenticate with your HubSpot Developer Account before use
   - Provides local development server and testing tools

### Required Accounts

You'll need to create accounts with the following services before starting development:

1. **Supabase Account**
   - Supabase provides your PostgreSQL database for storing OAuth tokens
   - Sign up for a free account on the Supabase website
   - The free tier is sufficient for MVP development

2. **Railway Account**
   - Railway will host your backend API server
   - Sign up for a free account on the Railway website
   - Railway provides automatic HTTPS and environment variable management

3. **HubSpot Developer Account**
   - Required to create and manage your HubSpot Marketplace app
   - Sign up at the HubSpot Developer Portal
   - This account gives you access to app creation tools, OAuth credentials, and the Developer Portal
   - Used for authenticating the HubSpot CLI

4. **HubSpot Account** (separate from Developer Account)
   - A regular HubSpot account is needed to access the "App Listings" section
   - This is where you create the marketplace listing (not in the Developer Portal)
   - Can be the same account as your Developer Account, but accessed through the regular HubSpot interface

5. **Start.gg Developer Account**
   - Required to register your application for Start.gg OAuth
   - Create an account on the Start.gg website and access the developer section
   - You'll need this to obtain OAuth client credentials

---

## Project Setup

### Step 1: Create Project Directory Structure

Create a new directory on your computer with the name `ggsynced-hubspot`. This will be the root directory for your entire project. Navigate into this directory using your terminal.

Within this root directory, create two subdirectories: one named `backend` and another named `frontend`. The backend directory will contain your Node.js Express server code, while the frontend directory will contain your React application.

Initialize a Git repository in the root directory. This allows you to track changes, create commits, and manage your codebase version history. Git is essential for collaboration and deployment workflows.

### Step 2: Create Project Configuration Files

Create a `.gitignore` file in the root directory. This file tells Git which files and directories should not be tracked in version control. Important items to exclude include: node_modules (dependencies), .env files (environment variables with secrets), build outputs, and IDE-specific files.

Create a `README.md` file in the root directory. This file should provide a brief overview of the project, its purpose, and how to get started. It serves as documentation for anyone who encounters your project.

---

## Supabase Setup

### Step 1: Create Supabase Project

Log into your Supabase account and navigate to the project creation page. Click the option to create a new project. You'll be prompted to provide:

- A project name (suggest using `ggsynced-hubspot` or a similar descriptive name)
- A database password (generate a strong, unique password and store it securely - you'll need it later)
- A region selection (choose the region closest to where your users will be or where you plan to deploy)

After submitting, Supabase will begin provisioning your project. This process typically takes 2-3 minutes. Wait for the project to fully initialize before proceeding.

### Step 2: Retrieve Supabase Credentials

Once your project is ready, navigate to the project settings. Look for the "API" section in the settings menu. Here you'll find several important credentials:

- **Project URL**: This is the base URL for your Supabase project (format: `https://xxxxx.supabase.co`)
- **anon/public key**: This is a public API key that can be used in client-side code (starts with `eyJ...`)
- **service_role key**: This is a private API key with elevated permissions (also starts with `eyJ...`)

**Critical Security Note**: The service_role key has full database access and should NEVER be exposed in client-side code or committed to version control. Only use it in your backend server code.

Copy these three values and store them securely. You'll need them when configuring your backend environment variables.

### Step 3: Create Database Tables

Navigate to the SQL Editor in your Supabase dashboard. This tool allows you to execute SQL commands directly against your database.

You need to create two tables:

1. **hubspot_accounts table**: This table stores OAuth tokens for HubSpot accounts. It needs columns for:
   - hub_id (the unique HubSpot account identifier, serves as primary key)
   - access_token (the OAuth access token for API calls)
   - refresh_token (the token used to obtain new access tokens when they expire)
   - expires_at (timestamp indicating when the access token expires)
   - created_at and updated_at (automatic timestamps for record tracking)

2. **startgg_accounts table**: This table stores OAuth tokens for Start.gg accounts. It needs columns for:
   - startgg_user_id (the unique Start.gg user identifier, serves as primary key)
   - hub_id (foreign key linking to the HubSpot account)
   - access_token (the OAuth access token)
   - refresh_token (the refresh token)
   - expires_at (token expiration timestamp)
   - created_at and updated_at (automatic timestamps)

Execute the SQL commands to create these tables. After creation, verify the tables exist by checking the Table Editor in the Supabase dashboard.

### Step 4: Set Up Automatic Timestamp Updates

Create database triggers that automatically update the `updated_at` column whenever a record is modified. This ensures you always know when tokens were last refreshed. The trigger uses a PostgreSQL function that sets the `updated_at` field to the current timestamp before any update operation.

### Step 5: Enable Row Level Security (Optional but Recommended)

Enable Row Level Security (RLS) on both tables. RLS is a PostgreSQL feature that adds an extra layer of security by controlling which rows users can access. While you'll primarily use the service_role key in your backend (which bypasses RLS), enabling RLS is a security best practice and prepares your database for potential future access patterns.

---

## HubSpot Marketplace App Setup

### Step 1: Create HubSpot Developer Account

Navigate to the HubSpot Developer Portal website and sign up for a developer account. If you already have a HubSpot account, you can use that to access the developer portal. Complete any required account verification steps.

### Step 2: Install HubSpot CLI

The HubSpot CLI is the official tool for building and managing HubSpot apps. Install it globally on your development machine using npm. The CLI provides commands for:
- Creating new app projects with proper structure
- Configuring OAuth and scopes
- Running local development server
- Building and deploying apps
- Managing app settings

After installation, verify the CLI is working by checking its version. You may need to authenticate the CLI with your HubSpot Developer Account.

### Step 3: Create a New App Using CLI

Use the HubSpot CLI to create a new app project. The CLI will:
- Scaffold a new app project with proper directory structure
- Create configuration files for OAuth, scopes, and app settings
- Set up the project with necessary dependencies
- Generate a unique App ID

Navigate to your project directory and run the CLI command to create a new app. The CLI will prompt you for:
- App name (e.g., "Start.gg Email Sync")
- App description
- Other configuration options

The CLI creates the app in your HubSpot Developer Account and sets up the local project structure.

### Step 4: Configure App Settings

After creating the app, configure it using either the CLI or the HubSpot Developer Portal. You'll need to set:
- **App name and description**: Basic information about your app
- **App logo**: Upload an icon (800x800 pixels, required for marketplace listing)
- **App type**: Specify that this is an embedded app

### Step 3: Configure OAuth Settings

Navigate to the "Auth" section within your app settings. This is where you configure how your app authenticates with HubSpot accounts.

**Redirect URLs**: Add the URLs where HubSpot should redirect users after they authorize your app. You'll need:
- A local development URL (e.g., `http://localhost:3000/api/auth/hubspot/callback`)
- A production URL (e.g., `https://your-railway-app.railway.app/api/auth/hubspot/callback`)

**Important**: The redirect URLs must match exactly, including the protocol (http vs https) and any trailing slashes. Mismatched URLs will cause OAuth to fail.

**Scopes**: Select the OAuth scopes your app requires. For this MVP, you need:
- `crm.objects.contacts.read` - Allows reading contact information
- `crm.objects.contacts.write` - Allows creating and updating contacts

These scopes define what data your app can access. Request only the minimum scopes needed for functionality.

### Step 4: Retrieve OAuth Credentials

After configuring OAuth, HubSpot will display your OAuth credentials in the Auth section:

- **Client ID**: A public identifier for your app
- **Client Secret**: A secret key used to authenticate your app (keep this secure!)

Copy both values and store them securely. You'll add these to your backend environment variables.

### Step 5: Configure App URLs

Configure where your app's frontend is hosted. You can do this through the CLI or Developer Portal:

- **App URL**: This is the URL where your React frontend application is accessible
  - For local development: Use the CLI's local development server
  - For production: Your deployed frontend URL (must be HTTPS)

**Important for Embedded Apps**: HubSpot Marketplace apps are embedded within the HubSpot interface using an iframe. Your frontend must be:
- Served over HTTPS in production (required for iframe embedding)
- Configured to accept requests from HubSpot's domain (CORS settings)
- Able to communicate with HubSpot's context API to receive installation information

The HubSpot CLI can help configure these settings and test your app locally before deployment.

### Step 6: Build Integration Using HubSpot CLI and APIs

Use the HubSpot CLI to build your integration:

- **Project Structure**: CLI creates proper project structure with configuration files
- **OAuth Configuration**: Configure OAuth settings through CLI or configuration files
- **Scope Management**: Define required scopes in app configuration
- **API Integration**: Use HubSpot APIs (Contacts API, etc.) to implement functionality
- **Local Development**: CLI provides local development server for testing
- **Build Process**: CLI handles building and preparing your app for deployment

The CLI integrates with HubSpot's APIs and ensures your app follows HubSpot's development standards and best practices.

### Step 7: Understand HubSpot App Installation Flow

When a user installs your app from the HubSpot Marketplace:

1. User clicks "Install" on your app listing
2. HubSpot redirects to your app's installation URL (if configured) or directly to OAuth
3. User authorizes your app with the requested scopes
4. HubSpot redirects back to your configured redirect URL with:
   - An authorization code
   - The hub_id (unique identifier for the HubSpot account)
5. Your backend exchanges the authorization code for access and refresh tokens
6. Your backend stores these tokens in Supabase, linked to the hub_id
7. The app is now installed and accessible within HubSpot

### Step 8: Understand Embedded App Context

When your app is embedded in HubSpot, HubSpot provides context information through:
- URL parameters (hub_id, user information)
- PostMessage API for secure communication
- HubSpot's JavaScript SDK for accessing HubSpot data

Your React frontend needs to:
- Extract the hub_id from the URL or context
- Use this hub_id to authenticate API requests to your backend
- Display UI that fits within HubSpot's interface design guidelines

---

## Start.gg OAuth Setup

### Step 1: Register Application with Start.gg

Log into your Start.gg account and navigate to the developer section. Look for the option to create a new OAuth application or register an app.

You'll need to provide:
- **Application name**: A descriptive name like "HubSpot Email Sync"
- **Description**: Explain what your application does
- **Redirect URI**: The URL where Start.gg will redirect after authorization
  - Local development: `http://localhost:3000/api/auth/startgg/callback`
  - Production: `https://your-railway-app.railway.app/api/auth/startgg/callback`

### Step 2: Select Required Scopes

Start.gg uses OAuth scopes to control what data your application can access. For this MVP, you need:

- `user.identity`: Access to the user's basic identity information
- `user.email`: Access to the user's email address
- `tournament.manager`: Permission to access tournaments the user manages

**Important**: The `tournament.manager` scope is critical - without it, your app cannot fetch tournament data or participant information. Only users who are tournament administrators will be able to use your app's sync functionality.

### Step 3: Retrieve OAuth Credentials

After registering your application, Start.gg will provide:

- **Client ID**: A public identifier for your application
- **Client Secret**: A secret key for authentication (keep secure!)

Store these credentials securely. You'll add them to your backend environment variables.

### Step 4: Understand Start.gg GraphQL API

Start.gg uses a GraphQL API rather than REST. This means:

- All API requests go to a single endpoint (typically `https://api.start.gg/gql/alpha`)
- You send GraphQL queries (not REST endpoints) to fetch data
- You need to authenticate requests by including the access token in the Authorization header
- The API supports pagination for large result sets

Your backend will need to:
- Construct GraphQL queries to fetch tournaments and participants
- Handle pagination when tournaments have many participants
- Parse GraphQL responses to extract email addresses

### Step 5: Verify API Access

Before proceeding with development, verify that:
- Your OAuth application is approved (some platforms require approval)
- The GraphQL endpoint URL is correct (check Start.gg documentation)
- You understand the GraphQL schema for tournaments and participants
- You know how to handle rate limits and errors

---

## Backend Implementation

### Step 1: Initialize Backend Project

Navigate to the `backend` directory you created earlier. Initialize a new Node.js project using npm. This creates a `package.json` file that will track your dependencies and project configuration.

### Step 2: Install Required Dependencies

Install the packages your backend needs:

- **Express**: Web framework for building your API server
- **CORS**: Middleware to handle Cross-Origin Resource Sharing (allows your frontend to call the API)
- **dotenv**: Loads environment variables from a `.env` file
- **Winston**: Logging library for recording events and errors
- **jsonwebtoken**: Creates and verifies JWT tokens for session management
- **cookie-parser**: Parses HTTP cookies from requests
- **axios**: HTTP client for making requests to HubSpot's REST API
- **graphql-request**: GraphQL client for querying Start.gg's API
- **@supabase/supabase-js**: Official Supabase client library for database operations

Also install TypeScript and development dependencies for type checking and development tooling.

### Step 3: Configure TypeScript

Create a TypeScript configuration file that tells the TypeScript compiler how to process your code. Configure it to:
- Target modern JavaScript (ES2020)
- Use CommonJS modules (Node.js standard)
- Output compiled JavaScript to a `dist` directory
- Read source files from a `src` directory
- Enable strict type checking for better code quality

### Step 4: Set Up Project Structure

Create a logical directory structure within your `backend/src` directory:

- `config/`: Configuration files (database connections, logger setup)
- `controllers/`: Request handlers for API endpoints
- `middleware/`: Custom middleware (authentication, error handling)
- `services/`: Business logic (HubSpot API calls, Start.gg API calls, token management)
- `types/`: TypeScript type definitions
- `utils/`: Utility functions

This organization makes your codebase maintainable and easier to navigate.

### Step 5: Configure Environment Variables

Create a `.env` file in your backend directory (and ensure it's in `.gitignore`). This file stores sensitive configuration:

- **Server configuration**: Port number, Node environment (development/production)
- **JWT secret**: A random string used to sign and verify session tokens (generate a strong, random value)
- **Supabase credentials**: Project URL and service_role key
- **HubSpot OAuth**: Client ID and Client Secret
- **Start.gg OAuth**: Client ID and Client Secret, plus GraphQL endpoint URL
- **Frontend URL**: Used for CORS configuration

Create a `.env.example` file (without actual secrets) to document what environment variables are needed.

### Step 6: Implement Supabase Client

Create a configuration file that initializes the Supabase client. This client will be used throughout your backend to interact with the database. Configure it to use the service_role key (which has full database access) and disable automatic session management (since you're using it server-side, not for user authentication).

### Step 7: Implement Logging System

Set up Winston logger with appropriate log levels and formatting. Configure it to:
- Log to the console during development (with colors for readability)
- Use structured JSON logging in production (easier to parse and search)
- Include timestamps and error stack traces
- Set appropriate log levels (debug in development, info/warn/error in production)

### Step 8: Implement Token Storage Service

Create a service class that handles all database operations for OAuth tokens. This service should:

- **Save HubSpot tokens**: Store access token, refresh token, expiration time, and hub_id
- **Retrieve HubSpot tokens**: Fetch tokens for a given hub_id
- **Save Start.gg tokens**: Store tokens linked to a hub_id
- **Retrieve Start.gg tokens**: Fetch Start.gg tokens for a given hub_id

Use the Supabase client to perform these operations. Handle errors gracefully and log all token operations for debugging.

### Step 9: Implement HubSpot Service

Create a service class that handles all interactions with HubSpot's API. This service should:

- **Token management**: Check if tokens are expired, refresh them automatically when needed
- **Token refresh**: Exchange refresh tokens for new access tokens when they expire
- **Batch contact upsert**: Take a list of email addresses and create/update contacts in HubSpot
  - HubSpot's batch API allows up to 100 contacts per request
  - Split larger lists into batches of 100
  - Handle errors for individual batches without failing the entire operation
  - Return summary statistics (how many succeeded, failed, etc.)

Implement proper error handling for:
- Expired tokens (refresh automatically)
- Rate limiting (add delays between requests)
- Invalid data (skip invalid emails, log errors)

### Step 10: Implement Start.gg Service

Create a service class that handles all interactions with Start.gg's GraphQL API. This service should:

- **Token management**: Similar to HubSpot service - check expiration and refresh automatically
- **Fetch managed tournaments**: Query Start.gg to get all tournaments the authenticated user manages
  - Use GraphQL query to get current user's tournaments
  - Return tournament ID, name, and slug (slug is used to fetch participants)
- **Fetch participant emails**: For a given tournament slug, fetch all participant email addresses
  - Use paginated GraphQL queries (Start.gg limits results per page)
  - Loop through all pages until all participants are fetched
  - Extract email addresses from the nested GraphQL response structure
  - Skip participants without email addresses (some may not have emails)
  - Deduplicate emails (same email might appear multiple times)
  - Return a clean list of unique email addresses

Handle errors for:
- Unauthorized access (user lost tournament manager permissions)
- Missing emails (participants without email addresses)
- Rate limiting (add delays between paginated requests)

### Step 11: Implement Authentication Middleware

Create Express middleware that authenticates incoming API requests. This middleware should:

- Extract JWT token from HTTP-only cookie (set during OAuth callback)
- Verify the token signature using your JWT secret
- Extract the hub_id from the token payload
- Attach the hub_id to the request object for use in controllers
- Return 401 Unauthorized if token is missing or invalid

This ensures only authenticated users (who have completed OAuth) can access protected endpoints.

### Step 12: Implement OAuth Callback Handlers

Create controller functions that handle OAuth callbacks from both HubSpot and Start.gg:

**HubSpot OAuth Callback**:
- Receives authorization code and hub_id from HubSpot redirect
- Exchanges authorization code for access and refresh tokens
- Calculates token expiration time
- Saves tokens to Supabase using token storage service
- Generates a JWT session token
- Sets JWT as an HTTP-only cookie (prevents XSS attacks)
- Redirects user back to frontend

**Start.gg OAuth Callback**:
- Receives authorization code from Start.gg redirect
- Extracts hub_id from authenticated session (user must be logged in)
- Exchanges authorization code for tokens
- Fetches user information to get Start.gg user ID
- Saves tokens to Supabase, linked to the hub_id
- Returns success response

### Step 13: Implement API Endpoint Handlers

Create controller functions for your API endpoints:

**GET /api/startgg/tournaments**:
- Requires authentication (use auth middleware)
- Retrieves Start.gg tokens for the authenticated hub_id
- Calls Start.gg service to fetch managed tournaments
- Returns tournament list to frontend

**POST /api/sync/startgg**:
- Requires authentication
- Receives tournament slug in request body
- Retrieves both HubSpot and Start.gg tokens
- Calls Start.gg service to fetch participant emails
- Calls HubSpot service to batch upsert contacts
- Returns sync summary (synced count, skipped count, error count, error details)

### Step 14: Set Up Express Server

Create the main server file that:
- Loads environment variables
- Creates Express application instance
- Configures middleware (CORS, JSON parsing, cookie parsing)
- Registers route handlers (health check, OAuth callbacks, API endpoints)
- Sets up error handling middleware (catches unhandled errors)
- Starts HTTP server listening on configured port

Configure CORS to:
- Allow requests from your frontend URL
- Allow credentials (cookies) to be sent with requests
- Only allow your frontend domain (security)

### Step 15: Test Backend Locally

Start your backend server in development mode. Verify:
- Server starts without errors
- Health check endpoint responds
- Environment variables are loaded correctly
- Database connection works (try a simple query)
- Logging is working (check console output)

Use a tool like curl or Postman to test endpoints manually before integrating with the frontend.

---

## Frontend Implementation

### Step 1: Initialize React Project

Navigate to the `frontend` directory. Use Create React App or Vite to initialize a new React project with TypeScript support. This sets up:
- React with TypeScript configuration
- Build tooling (webpack or Vite)
- Development server
- Hot module replacement for fast development

### Step 2: Install Dependencies

Install packages your frontend needs:

- **axios**: HTTP client for making API calls to your backend
- **@hubspot/api-client**: Official HubSpot JavaScript SDK (if needed for HubSpot context)

The HubSpot SDK may be needed to:
- Access HubSpot context information (hub_id, user info)
- Communicate with HubSpot's postMessage API
- Access HubSpot UI components (if using HubSpot design system)

### Step 3: Configure Environment Variables

Create environment variable files for your React app. React apps typically use variables prefixed with `REACT_APP_` (or `VITE_` for Vite):

- **Backend URL**: The URL where your backend API is hosted
  - Local: `http://localhost:3000`
  - Production: Your Railway backend URL
- **HubSpot App ID**: Your HubSpot app's unique identifier (if needed for HubSpot SDK)

### Step 4: Create API Client

Create a service module that handles all communication with your backend API. This module should:

- Configure axios with your backend URL
- Set `withCredentials: true` to send cookies with requests (required for JWT authentication)
- Provide functions for each API endpoint:
  - Get HubSpot OAuth URL
  - Get Start.gg OAuth URL
  - Fetch tournaments
  - Sync participants

This centralizes API communication and makes it easy to update endpoints later.

### Step 5: Create UI Components

Build React components for your user interface:

**HubSpot Connect Component**:
- Displays a button to connect HubSpot account
- On click, fetches OAuth URL from backend and redirects user
- Shows connection status (connected/not connected)
- Handles OAuth callback redirect (checks URL parameters)

**Start.gg Connect Component**:
- Similar to HubSpot connect component
- Initiates Start.gg OAuth flow
- Shows connection status

**Tournament Selector Component**:
- Fetches tournament list from backend on mount
- Displays tournaments in a dropdown/select element
- Handles loading and error states
- Calls callback function when user selects a tournament

**Sync Button Component**:
- Displays sync button (disabled until tournament is selected)
- Shows loading state during sync operation
- Calls backend sync endpoint with selected tournament slug
- Displays sync results (synced count, skipped count, errors)
- Shows error messages if sync fails

### Step 6: Handle HubSpot Embedded Context

When your app is embedded in HubSpot, you need to:

- Extract hub_id from URL parameters or HubSpot context
- Use hub_id to authenticate API requests (backend uses it to look up tokens)
- Design UI to fit within HubSpot's interface (consider HubSpot design guidelines)
- Handle iframe communication if needed (HubSpot may send messages via postMessage)

HubSpot provides context through:
- URL query parameters when app loads
- JavaScript SDK methods to access context
- PostMessage API for secure cross-origin communication

### Step 7: Implement Main App Component

Create your main App component that:
- Renders all child components
- Manages application state (which accounts are connected, selected tournament)
- Handles routing if needed (though MVP may be single-page)
- Provides overall layout and styling

### Step 8: Style the Application

Apply styling to make your app:
- Visually consistent with HubSpot's design (if embedded)
- User-friendly and intuitive
- Responsive (works on different screen sizes)
- Accessible (proper contrast, keyboard navigation)

You can use:
- CSS modules
- Styled-components
- Tailwind CSS
- Or plain CSS

### Step 9: Test Frontend Locally

Start your frontend development server. Test:
- Components render correctly
- API calls work (may need backend running)
- OAuth flows redirect properly
- Error states display correctly
- UI is responsive

For testing embedded behavior, you may need to:
- Use HubSpot's local development tools
- Or deploy to a test environment and configure HubSpot to point to it

---

## Testing

### Step 1: Test Backend Endpoints

Test each backend endpoint individually:

- **Health check**: Verify server is running
- **OAuth URL endpoints**: Verify they return correct URLs
- **OAuth callbacks**: Test with actual OAuth flows (requires OAuth providers)
- **Protected endpoints**: Verify authentication middleware works (should reject requests without valid JWT)

Use tools like:
- curl (command line)
- Postman (GUI tool)
- HTTPie (command line with better formatting)

### Step 2: Test OAuth Flows

Test the complete OAuth flows:

**HubSpot OAuth**:
1. Click connect button in frontend
2. Complete HubSpot authorization
3. Verify redirect back to your app
4. Check Supabase - tokens should be saved
5. Verify JWT cookie is set
6. Try accessing protected endpoint - should work

**Start.gg OAuth**:
1. Ensure HubSpot is connected first
2. Click Start.gg connect button
3. Complete Start.gg authorization
4. Verify redirect back to your app
5. Check Supabase - Start.gg tokens should be saved, linked to hub_id

### Step 3: Test Tournament Fetching

After connecting both accounts:
- Tournament list should load in frontend
- Verify tournaments shown are ones you actually manage
- Test error handling (disconnect Start.gg, try fetching - should show error)

### Step 4: Test Sync Functionality

Test the complete sync flow:

1. Select a tournament from the dropdown
2. Click "Sync Participants" button
3. Verify loading state shows
4. Wait for sync to complete
5. Verify sync results display correctly:
   - Number synced
   - Number skipped (if any)
   - Errors (if any)
6. Check HubSpot - contacts should be created/updated
7. Verify emails match participants from Start.gg

Test edge cases:
- Tournament with no participants
- Tournament with participants missing emails
- Large tournament (tests pagination)
- Network errors (disconnect internet, verify error handling)

### Step 5: Test Error Handling

Test how your app handles errors:

- Invalid tokens (manually expire tokens in database, try API call)
- Missing tokens (delete tokens, try sync)
- API rate limits (make many rapid requests)
- Network failures (simulate offline)
- Invalid tournament slugs
- Missing email addresses

Verify:
- Errors are logged on backend
- User-friendly error messages display in frontend
- App doesn't crash on errors
- Users can retry after errors

### Step 6: Test Security

Verify security measures:

- JWT tokens are HTTP-only cookies (check in browser DevTools)
- CORS only allows your frontend domain
- Environment variables aren't exposed in client code
- API endpoints require authentication
- Tokens are stored securely in Supabase

---

## Deployment

### Step 1: Prepare Backend for Production

Before deploying, ensure:

- All environment variables are configured for production values
- `NODE_ENV` is set to `production`
- Backend URL is updated to production Railway URL
- Frontend URL is updated to production frontend URL
- OAuth redirect URIs are updated in both HubSpot and Start.gg
- Database connection uses production Supabase project
- Logging is configured for production (structured JSON logs)

Build your backend TypeScript code to JavaScript. Verify the build succeeds and the `dist` directory contains compiled files.

### Step 2: Deploy Backend to Railway

Log into your Railway account and create a new project. Connect your Git repository (Railway can deploy directly from GitHub/GitLab).

Configure Railway to:
- Use the `backend` directory as the project root
- Set build command to compile TypeScript (e.g., `npm run build`)
- Set start command to run the compiled JavaScript (e.g., `node dist/index.js`)
- Automatically detect Node.js runtime

Add all environment variables in Railway's dashboard:
- Copy all variables from your `.env` file
- Update URLs to production values
- Ensure secrets are set correctly

Railway will:
- Build your application
- Start the server
- Provide a public URL (e.g., `https://your-app.railway.app`)
- Handle HTTPS automatically
- Restart on crashes
- Scale as needed

After deployment, verify:
- Health check endpoint responds
- Server logs are visible in Railway dashboard
- No errors in startup logs

### Step 3: Update OAuth Redirect URIs

Update redirect URIs in both OAuth providers to use your production backend URL:

**HubSpot**:
- Go to app settings → Auth
- Update redirect URI to: `https://your-railway-app.railway.app/api/auth/hubspot/callback`

**Start.gg**:
- Go to your OAuth application settings
- Update redirect URI to: `https://your-railway-app.railway.app/api/auth/startgg/callback`

**Critical**: These must match exactly, including the protocol (https) and path.

### Step 4: Deploy Frontend

For HubSpot Marketplace apps, the frontend deployment depends on your setup:

**Option A: Deploy to Railway (for testing)**
- Create a second Railway service for frontend
- Configure build command: `npm run build`
- Configure start command: `npx serve -s build` (or use a static file server)
- Update `REACT_APP_BACKEND_URL` to your Railway backend URL
- Railway will provide a frontend URL

**Option B: Deploy to HubSpot (Production)**
- HubSpot Marketplace apps can be hosted by HubSpot
- Configure your app URL in HubSpot Developer Portal
- HubSpot will embed your app in an iframe
- Your app must be accessible via HTTPS

**Option C: Deploy to Static Hosting**
- Deploy built React app to services like:
  - Vercel
  - Netlify
  - AWS S3 + CloudFront
- Ensure HTTPS is enabled
- Update CORS settings on backend to allow your frontend domain

### Step 5: Create App Listing in HubSpot Account

Navigate to your HubSpot account (not Developer Portal) and go to the "App Listings" section. This is where you create the marketplace listing for your app.

**Create New Listing**:
- Click "Create Listing" and select your app
- Fill out all required listing information

**Define Features**:
- Provide detailed descriptions of your app's features and functionality
- Explain how the app integrates with HubSpot
- Highlight key benefits for users

**Define Pricing**:
- Set up pricing plans (free, paid, freemium, etc.)
- Provide clear pricing information
- Link to detailed pricing page if needed

**Setup Instructions**:
- Create comprehensive setup guide that is publicly accessible
- Include installation steps, configuration instructions, and usage guidelines
- Ensure guide is not behind a paywall or login requirement
- The setup guide is critical for marketplace approval

**Other Listing Requirements**:
- App name, company information, tagline
- App icon (800x800 pixels)
- Demo video and screenshots showcasing functionality
- Support contact information and resources
- Testing information for HubSpot's review team

### Step 6: Ensure Marketplace Listing Requirements Are Met

Before submitting, verify your app meets all marketplace listing requirements:

- **Functionality**: App works as described and provides value
- **Setup Guide**: Publicly accessible, comprehensive, and up-to-date
- **Documentation**: All features are documented
- **Pricing**: Clear and consistent pricing information
- **Support**: Accessible support channels for users
- **Minimum Installations**: At least 3 active installations in different HubSpot accounts
- **Quality Standards**: App meets HubSpot's quality and security standards

### Step 7: Submit App Listing for Review

Once all requirements are met:

- Review all listing information for accuracy
- Submit the app listing for review through the App Listings section
- HubSpot Ecosystem Quality team will review (typically 10 business days for initial review)
- Be prepared to respond to feedback and make necessary adjustments
- The entire review process should not exceed 60 days

### Step 8: Configure HubSpot App Settings (Developer Portal)

In your HubSpot Developer Portal:

- Update App URL to your production frontend URL
- Ensure all OAuth settings are correct
- Verify app configuration matches your listing information

### Step 6: Verify Production Deployment

Test the complete flow in production:

1. Access your app through HubSpot (if embedded) or directly
2. Test HubSpot OAuth flow
3. Test Start.gg OAuth flow
4. Test tournament fetching
5. Test sync functionality
6. Verify contacts are created in HubSpot
7. Check backend logs for any errors

### Step 7: Monitor Production

Set up monitoring:

- Check Railway logs regularly for errors
- Monitor API response times
- Watch for rate limit errors
- Track sync success/failure rates
- Monitor database connection health

---

## Security Best Practices

### Environment Variables

- **Never commit `.env` files** to version control
- Use Railway's environment variable management (never hardcode secrets)
- Rotate secrets regularly (especially if exposed)
- Use different secrets for development and production
- Document required environment variables in `.env.example` (without actual values)

### JWT Tokens

- Use a **strong, random JWT secret** (minimum 32 characters, use a password generator)
- Set appropriate expiration times (balance security vs. user experience)
- Store JWTs in **HTTP-only cookies** (prevents JavaScript access, protects against XSS)
- Use **secure flag** in production (ensures cookies only sent over HTTPS)
- Use **SameSite attribute** to prevent CSRF attacks

### OAuth Tokens

- Store tokens **encrypted** in database (Supabase can encrypt at rest)
- Implement **automatic token refresh** before expiration (don't wait until token expires)
- Handle **token revocation** gracefully (if user revokes access, show appropriate message)
- **Never log tokens** in plain text (mask them in logs)
- Use **minimal OAuth scopes** (only request what you need)

### API Security

- Use **HTTPS everywhere** in production (Railway provides this automatically)
- **Validate all input** (check tournament slugs, email formats, etc.)
- Implement **rate limiting** (prevent abuse, protect your backend)
- Return **generic error messages** to clients (don't expose internal details)
- Log detailed errors **server-side only** (for debugging, not user-facing)

### CORS Configuration

- **Only allow your frontend domain** (don't use wildcards in production)
- Use `credentials: true` only when necessary (for cookies)
- Regularly review and update allowed origins

### Database Security

- Use **service_role key only in backend** (never in frontend code)
- Enable **Row Level Security** on Supabase tables (extra protection layer)
- Use **parameterized queries** (Supabase client handles this automatically)
- Regularly **backup your database** (Supabase provides automatic backups)
- **Monitor database access** (check Supabase logs for suspicious activity)

### Error Handling

- **Don't expose sensitive information** in error messages
- Log errors **server-side** with full context (for debugging)
- Return **user-friendly messages** to clients (generic, not technical)
- Implement **proper error boundaries** in React (prevent full app crashes)

---

## Troubleshooting

### Backend Issues

**Problem: Server won't start**
- Check all environment variables are set (use `console.log` to verify, but don't log secrets)
- Verify Node.js version is 18 or higher
- Check port isn't already in use (try a different port)
- Review error messages in console for specific issues
- Verify all dependencies are installed (`npm install`)

**Problem: Database connection fails**
- Verify Supabase URL is correct (check for typos)
- Verify service_role key is correct (regenerate if unsure)
- Check Supabase project is active (not paused)
- Verify network connectivity (can you reach Supabase from your server?)
- Check Supabase dashboard for any service issues

**Problem: OAuth callbacks fail**
- Verify redirect URIs match **exactly** in OAuth provider settings (including http vs https, trailing slashes)
- Check CORS settings allow your frontend domain
- Verify client ID and secret are correct (no typos, right environment)
- Check OAuth provider logs/dashboard for error details
- Verify callback endpoint is accessible (test with curl)

### Frontend Issues

**Problem: API calls fail with CORS errors**
- Verify `FRONTEND_URL` in backend matches your actual frontend URL
- Check `withCredentials: true` is set in axios configuration
- Verify backend CORS middleware allows your frontend origin
- Check browser console for specific CORS error message
- Ensure both frontend and backend URLs use same protocol (http vs https) in development

**Problem: Cookies not being sent**
- Verify `withCredentials: true` in axios config
- Check cookie settings (HttpOnly, Secure, SameSite) in backend
- Test in browser DevTools → Application → Cookies (verify cookie exists)
- Check if browser blocks third-party cookies (privacy settings)
- Verify frontend and backend are on same domain or properly configured for cross-domain cookies

**Problem: HubSpot context not available**
- Check if app is actually embedded in HubSpot (not running standalone)
- Verify HubSpot SDK is loaded correctly
- Check browser console for HubSpot SDK errors
- Verify App URL is configured correctly in HubSpot Developer Portal
- Test with HubSpot's local development tools if available

### OAuth Issues

**Problem: "Invalid redirect_uri" error**
- Redirect URI must match **exactly** (including protocol, domain, path, trailing slashes)
- Update redirect URI in both OAuth provider settings AND your backend code
- Check for URL encoding issues
- Verify you're using the correct environment (dev vs production URLs)

**Problem: Token refresh fails**
- Verify refresh token endpoint URL is correct (check OAuth provider documentation)
- Check token expiration times are calculated correctly
- Verify client credentials are correct
- Check OAuth provider logs for specific error
- Some providers require refresh tokens to be used within a time window

**Problem: "Access denied" or "Insufficient permissions"**
- Verify requested scopes are approved in OAuth provider
- Check if user has necessary permissions (e.g., tournament manager role)
- Verify scopes haven't changed in OAuth provider settings
- Some scopes require app approval from OAuth provider

### Sync Issues

**Problem: No tournaments found**
- Verify user has `tournament.manager` scope
- Check if user is actually a tournament administrator
- Verify GraphQL query syntax is correct
- Check Start.gg API documentation for any schema changes
- Test GraphQL query directly in Start.gg's GraphQL playground (if available)

**Problem: Emails not syncing to HubSpot**
- Check HubSpot API permissions (verify scopes are granted)
- Verify batch size doesn't exceed 100 (HubSpot limit)
- Check HubSpot rate limits (may need to add delays)
- Review backend logs for specific error messages
- Verify email format is valid (HubSpot may reject invalid emails)
- Check if HubSpot account has contact creation limits (some plans have limits)

**Problem: Some emails skipped**
- Some participants may not have email addresses (this is expected)
- Check sync summary for details on skipped emails
- Verify email extraction logic handles missing emails gracefully
- Some emails may be invalid format (check email validation)

### Database Issues

**Problem: Tables not found**
- Run SQL migration script again in Supabase SQL Editor
- Verify table names are exactly as expected (case-sensitive)
- Check you're connected to the correct Supabase project
- Verify service_role key has proper permissions

**Problem: Token operations fail**
- Check Supabase connection is working (test with simple query)
- Verify table schema matches your code expectations
- Check for data type mismatches (timestamps, strings, etc.)
- Review Supabase logs for specific database errors

### General Debugging Tips

1. **Check logs first**: Both backend (Railway) and frontend (browser console) logs contain valuable error information

2. **Test endpoints individually**: Use curl or Postman to test backend endpoints without frontend complexity

3. **Verify environment variables**: Double-check all environment variables are set correctly (especially in production)

4. **Check OAuth provider dashboards**: Both HubSpot and Start.gg provide logs/analytics that show OAuth flow issues

5. **Use browser DevTools**: Network tab shows API requests/responses, Console shows JavaScript errors, Application tab shows cookies/storage

6. **Test in incognito mode**: Rules out browser extension or cache issues

7. **Verify API documentation**: OAuth providers and APIs change - check latest documentation

8. **Check rate limits**: Both HubSpot and Start.gg have rate limits - too many requests will fail

---

## Important Notes and Considerations

### HubSpot Marketplace App Specifics

- **Embedded Apps**: HubSpot apps are embedded in iframes, which affects how your frontend communicates with HubSpot and receives context
- **Installation Flow**: Users install your app from the HubSpot Marketplace, which triggers the OAuth flow automatically
- **App URL Configuration**: Your app URL must be HTTPS in production (HubSpot requires this for security)
- **Context API**: HubSpot provides installation context (hub_id, user info) that your app needs to extract
- **Design Guidelines**: HubSpot has design guidelines for embedded apps - follow them for better user experience

### Start.gg API Considerations

- **GraphQL Schema**: Start.gg's GraphQL schema may change - verify queries against latest documentation
- **Rate Limits**: Start.gg has rate limits - implement proper delays and retry logic
- **Tournament Manager Scope**: Only users with tournament manager permissions can use your app - handle this gracefully
- **Email Availability**: Not all participants have email addresses - this is expected behavior

### Development vs Production

- **Environment Variables**: Use different values for development and production (different OAuth apps, different databases)
- **OAuth Apps**: Create separate OAuth applications for development and production (don't mix them)
- **Database**: Consider using separate Supabase projects for development and production
- **Logging**: Development logging can be verbose, production logging should be structured and minimal

### Future Enhancements

After completing the MVP, consider:

- **Error Recovery**: Automatic retry with exponential backoff for failed API calls
- **Monitoring**: Set up error tracking (e.g., Sentry) and performance monitoring
- **Testing**: Add unit tests, integration tests, and end-to-end tests
- **Rate Limiting**: Implement rate limiting on your backend API
- **User Feedback**: Better UI/UX for sync status and error messages
- **Validation**: Validate email formats before syncing
- **Pagination UI**: For large tournament lists
- **Sync History**: Track sync history and allow users to see past syncs

---

## Support Resources

- **Supabase Documentation**: Comprehensive guides for database operations, authentication, and API usage
- **Railway Documentation**: Deployment guides, environment variable management, and troubleshooting
- **HubSpot Developer Documentation**: API references, OAuth guides, embedded app development, marketplace listing requirements
- **Start.gg Developer Documentation**: GraphQL API documentation, OAuth setup, rate limits
- **React Documentation**: Component development, hooks, state management
- **Express Documentation**: Middleware, routing, error handling
- **TypeScript Documentation**: Type system, configuration, best practices

---

**End of Implementation Guide**
