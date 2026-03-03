const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');

const initializePassport = () => {
    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Load Google OAuth credentials from environment variables only
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback';

    // Google OAuth Strategy - chỉ đăng ký nếu có credentials từ environment
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_CALLBACK_URL,
            scope: ['profile', 'email'],
            passReqToCallback: true // Cho phép truy cập req để lấy state
        }, (req, accessToken, refreshToken, profile, done) => {
            // Verify state từ query params với cookie
            const stateFromQuery = req.query?.state;
            const stateFromCookie = req.cookies?.oauth_state;
            
            // State verification sẽ được xử lý trong controller
            // Ở đây chỉ pass profile
            return done(null, profile);
        }));
        console.log('✅ Google OAuth strategy registered');
    } else {
        console.log('⚠️ Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    }
};

module.exports = initializePassport;