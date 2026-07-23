# Authentication Architecture

## JWT & Session Management
1. **Login**: User submits credentials to `/api/v1/auth/login`. If valid, the system issues a short-lived `JWT access token` and a long-lived `Refresh token`.
2. **Session Storage**: The `Refresh token` is securely stored in the database (`Session` table) and set as an `HttpOnly` cookie for security against XSS.
3. **Access**: The frontend stores the access token in memory or local storage and injects it as a `Bearer` token in the `Authorization` header.
4. **Interception**: If the access token expires, the backend returns `401 Unauthorized`. The frontend `ApiClient` transparently catches this, calls `/api/v1/auth/refresh` to get a new token, and retries the request seamlessly.

## Security Practices
- Passwords are never stored in plaintext (using `bcrypt` with salt rounds).
- `JWT_SECRET` is heavily guarded in environment variables.
- Refresh tokens are rotated upon each use, protecting against token theft (Refresh Token Rotation).
