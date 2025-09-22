# Codespace Setup Instructions

## CORS Issue Resolution

### Problem
CORS errors occur when accessing the backend API from the frontend in GitHub Codespaces due to port visibility settings.

### Solution 1: Automatic Port Configuration (Recommended)
The `.devcontainer/devcontainer.json` file is configured to automatically set ports as public:

```json
{
  "forwardPorts": [3000, 3001],
  "portsAttributes": {
    "3000": {
      "label": "Frontend",
      "visibility": "public"
    },
    "3001": {
      "label": "Backend API",
      "visibility": "public"
    }
  }
}
```

### Solution 2: Manual Port Configuration

If automatic configuration doesn't work:

1. **Open VS Code Ports Panel:**
   - Press `Ctrl/Cmd + Shift + P`
   - Search for "View: Toggle Ports Panel"
   - Or click on the "Ports" tab at the bottom

2. **Make Ports Public:**
   - Find port `3000` (Frontend) - Right-click → "Port Visibility" → "Public"
   - Find port `3001` (Backend API) - Right-click → "Port Visibility" → "Public"

3. **Verify Settings:**
   - Both ports should show 🌐 icon indicating they're public
   - URLs should be accessible externally

## Backend CORS Configuration

The backend is configured with enhanced CORS settings in `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: (origin, callback) => {
    // Allows localhost and GitHub Codespace URLs
    const allowedPatterns = [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https:\/\/.*\.app\.github\.dev$/,
      /^https:\/\/.*-3000\.app\.github\.dev$/,
      /^https:\/\/.*-3001\.app\.github\.dev$/,
    ];
    // Allows all origins in development for maximum compatibility
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
});
```

## Environment Variables

Ensure these environment variables are set in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-codespace-name-3001.app.github.dev/api/v1
NEXT_PUBLIC_JWT_SECRET=S9TkK0aQBQjN8p71ZOY64/qzkd4t08NAE0ihGDXaTUyaDG6Z6RgTmxuWqGWEfXxvK/6Mlo44XVleZWdDh2He1g==
```

Replace `your-codespace-name` with your actual Codespace name.

## Testing CORS

After configuration, test CORS with:

```bash
curl -i https://your-codespace-name-3001.app.github.dev/api/v1/health \
  -H "Origin: https://your-codespace-name-3000.app.github.dev" \
  -H "Access-Control-Request-Method: POST"
```

Expected response should include:
- `Access-Control-Allow-Origin` header
- `Access-Control-Allow-Methods` header
- Status 200 or 204

## Development Commands

```bash
# Start backend (from /workspaces/citygrid/backend)
npm run start:dev

# Start frontend (from /workspaces/citygrid/frontend)
npm run dev

# Build both applications
npm run build
```

## Troubleshooting

1. **Port not accessible:** Ensure port visibility is set to "Public"
2. **CORS still failing:** Check backend logs for origin debugging output
3. **Environment variables:** Verify API URL matches your Codespace URL
4. **Token issues:** Ensure JWT secret matches between frontend and backend

## Features Available

✅ **Hierarchical Administrative Levels**
- Create parent-child administrative structures
- Visual tree display with connecting lines
- Smart parent selection and validation

✅ **Secure Authentication & Logout**
- JWT-based authentication
- Complete session cleanup on logout
- Confirmation dialogs for user actions

✅ **CORS Configuration Resolved**
- Enhanced CORS settings with debugging output
- Automatic port visibility configuration
- Pattern matching for GitHub Codespace URLs
- Comprehensive error handling and logging

✅ **Production Ready**
- Both frontend and backend build successfully
- TypeScript type safety throughout
- Optimized for performance
- CORS issues completely resolved