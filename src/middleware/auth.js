const { auth, isFirebaseReady } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (isFirebaseReady() && auth) {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0]
      };
      return next();
    } else {
      // Local Development/Mock Auth Flow
      if (token.startsWith('mock-token-')) {
        const uid = token.replace('mock-token-', '');
        req.user = {
          uid: uid,
          email: `${uid}@student.reflectai.edu`,
          name: uid.charAt(0).toUpperCase() + uid.slice(1)
        };
        return next();
      } else {
        return res.status(401).json({ 
          error: 'Unauthorized: Firebase is not configured and token does not match local dev format "mock-token-<uid>"' 
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
  }
};

module.exports = { verifyToken };
