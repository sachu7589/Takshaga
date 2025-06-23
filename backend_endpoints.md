# Backend Endpoints for JWT Authentication

You need to add these endpoints to your backend to support the JWT authentication with persistent login:

## 1. Token Verification Endpoint (Required for Persistent Login)

Add this route to your backend:

```javascript
// http://localhost:3000/api/users/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                image: user.image,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            message: 'Error fetching user data',
            error: error.message
        });
    }
});
```

## 2. Authentication Middleware

Add this middleware function to your backend:

```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
```

## 3. Updated Login Endpoint

Your existing login endpoint is already correct, but make sure it returns the token and user data as shown in your example.

## 4. Environment Variable

Make sure to move the JWT secret to an environment variable:

```javascript
// In your .env file
JWT_SECRET=your_secure_jwt_secret_here

// In your code
const token = jwt.sign(
    { _id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);
```

## 5. Protected Routes

Use the `authenticateToken` middleware for any routes that require authentication:

```javascript
router.get('/protected-route', authenticateToken, (req, res) => {
    // This route is now protected
    res.json({ message: 'Protected data', user: req.user });
});
```

## 6. Logout Endpoint (Optional)

You can add a logout endpoint to invalidate tokens on the server side:

```javascript
// http://localhost:3000/api/users/logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // You can implement token blacklisting here if needed
        // For now, we'll just return success since the frontend handles token removal
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            message: 'Error during logout',
            error: error.message
        });
    }
});
```

## Summary of Changes Needed:

1. Add the `/me` endpoint for token verification (REQUIRED for persistent login)
2. Add the `authenticateToken` middleware
3. Move JWT secret to environment variables
4. Update any routes that need authentication to use the middleware
5. Optionally add a logout endpoint

## How Persistent Login Works:

1. **App Startup**: When the app loads, it checks localStorage for an existing JWT token
2. **Token Verification**: If a token exists, it calls `/api/users/me` to verify the token
3. **Auto Login**: If the token is valid, the user is automatically logged in
4. **Token Storage**: Tokens are stored in localStorage and persist across browser sessions
5. **Automatic Logout**: If the token is invalid or expired, the user is automatically logged out
6. **Manual Logout**: Users can manually logout, which clears the token from localStorage

## Security Features:

- **Token Expiration**: Tokens expire after 7 days (configurable)
- **Automatic Verification**: Tokens are verified on every app startup
- **Secure Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
- **Automatic Cleanup**: Invalid tokens are automatically removed
- **Protected Routes**: All routes except login/register require valid authentication

The frontend now has a robust persistent login system that will keep users logged in until they explicitly logout or their token expires. 