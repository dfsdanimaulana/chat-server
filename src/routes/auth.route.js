const passport = require('passport')
require('dotenv').config()
const router = require('express').Router()
const { authController } = require('../controllers')
const { authValidation } = require('../validations')
const { authJwt, verifySignUp, validate } = require('../middleware')

router.route('/login').post(validate(authValidation.login), authController.login)
router
  .route('/register')
  .post(verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.validateData, authController.userRegister)
router.route('/logout').post(authJwt.verifyToken, authController.userLogout)
router.route('/refresh').get(authController.refreshToken)
router.route('/reset-password').post(authJwt.verifyToken, authController.changeUserPassword)

// google Oauth
router.route('/google').get(passport.authenticate('google', { scope: ['profile', 'email'] }))
router.route('/google/callback').get(
  passport.authenticate('google', {
    successRedirect: 'http://localhost:3003/v1/auth/login/success',
    failureRedirect: 'http://localhost:3003/v1/auth/login/failed'
  })
)

// facebook Oauth
router.route('/facebook').get(passport.authenticate('facebook', { scope: ['profile', 'email'] }))
router.route('/facebook/callback').get(
  passport.authenticate('facebook', {
    successRedirect: 'http://localhost:3003/v1/auth/login/success',
    failureRedirect: 'http://localhost:3003/v1/auth/login/failed'
  })
)

// github Oauth
router.route('/github').get(passport.authenticate('github', { scope: ['profile', 'email'] }))
router.route('/github/callback').get(
  passport.authenticate('github', {
    successRedirect: 'http://localhost:3003/v1/auth/login/success',
    failureRedirect: 'http://localhost:3003/v1/auth/login/failed'
  })
)

router.route('/login/success').get((req, res) => {
  res.send({ message: 'login success', user: req.user })
})

router.route('/login/failed').get((req, res) => {
  res.send({ error: 'login failed' })
})

module.exports = router
