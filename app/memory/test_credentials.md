# Test Credentials for NEXUS CAPITAL Financial Platform

## Authentication Method
- **Type**: Emergent Google OAuth
- **Provider**: Google Social Login
- **Session Duration**: 7 days

## Test Users
Authentication is handled via Google OAuth. Test with any valid Google account.

### Example Test Accounts:
1. **Primary Test Account**
   - Email: Use any valid Google account
   - Authentication: Click "Sign In" → Authorize with Google
   - Role: Standard User (all features accessible)

## Session Management
- Sessions are stored in `user_sessions` collection
- Session tokens are httpOnly cookies
- Automatic expiration after 7 days

## Database Collections
- `users`: User profiles (user_id, email, name, picture)
- `user_sessions`: Active sessions (user_id, session_token, expires_at)
- `analysis_history`: AI analysis results (user_id, analysis_type, query, result)

## Notes
- No password-based authentication (OAuth only)
- Sessions persist across browser sessions via httpOnly cookies
- Logout clears session from database and cookie
