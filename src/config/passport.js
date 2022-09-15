const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const GithubStrategy = require('passport-github2').Strategy
const FacebookStrategy = require('passport-facebook').Strategy

require('dotenv').config()

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/v1/auth/google/callback'
    },
    function (accessToken, refreshToken, profile, done) {
      // save user data to database
      return done(null, profile)
    }
  )
)

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/v1/auth/github/callback'
    },
    function (accessToken, refreshToken, profile, done) {
      // save user data to database
      return done(null, profile)
    }
  )
)

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: '/v1/auth/facebook/callback'
    },
    function (accessToken, refreshToken, profile, done) {
      // save user data to database
      return done(null, profile)
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user)
})
passport.deserializeUser((user, done) => {
  done(null, user)
})
