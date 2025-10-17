// backend/middleware/auth.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Person = require('../models/person');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await Person.findOne({ username });
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        
        const isPasswordMatch = await user.comparePassword(password);
        if (isPasswordMatch) {
            // Standardize the user object to ensure consistent property naming
            const standardizedUser = {
                _id: user._id.toString(), // Ensure _id is a string
                username: user.username,
                // Add other necessary user fields, ensuring consistent naming
                pincode: user.pincode,
                // ... other fields
            };
            return done(null, standardizedUser);
        } else {
            return done(null, false, { message: 'Incorrect password.' });
        }
    } catch (error) {
        return done(error);
    }
}));

// Authentication middleware
const authenticateUser = (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: info.message });
        }

        // Generate JWT token with standardized user ID
        const token = jwt.sign(
            { 
                _id: user._id,
                username: user.username
            }, 
            JWT_SECRET,
            { expiresIn: "365d" } // Always set expiry
        );
        
        // Ensure consistent user object structure
        const userResponse = {
            _id: user._id, // Using _id consistently
            username: user.username,
            pincode: user.pincode,
            // Add other necessary user fields
        };

        req.user = userResponse;
        req.token = token;
        next();
    })(req, res, next);
};

// JWT verification middleware
const verifyToken = (req, res, next) => {
    let token = req.headers.authorization || req.headers.Authorization;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Accept 'Bearer <token>' or just the token
    if (typeof token === "string" && token.startsWith("Bearer ")) {
        token = token.slice(7);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            _id: decoded._id,
            username: decoded.username
        };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { passport, authenticateUser, verifyToken };
