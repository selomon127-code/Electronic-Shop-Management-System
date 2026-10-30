// backend/config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Serialize user (store user ID in session)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user (retrieve user from ID)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔍 Google profile received:", {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
        });

        // Find existing user by Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log("✅ Existing Google user found:", user.email);
          return done(null, user);
        }

        // Check if user exists with same email (registered with local auth)
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.avatar = profile.photos[0]?.value;
          user.authProvider = "google";
          await user.save();
          console.log("✅ Linked Google to existing user:", user.email);
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          authProvider: "google",
          role: "user",
          // No password needed for Google users
        });

        console.log("✅ New Google user created:", user.email);
        return done(null, user);
      } catch (err) {
        console.error("❌ Google auth error:", err.message);
        return done(err, null);
      }
    },
  ),
);

module.exports = passport;
