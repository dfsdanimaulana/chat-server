const router = require('express').Router()
const { authController } = require('../controllers')
const { authJwt, verifySignUp } = require('../middleware')

router.route('/login').post(authController.userLogin)
router
  .route('/register')
  .post(verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.validateData, authController.userRegister)
router.route('/logout').post(authJwt.verifyToken, authController.userLogout)
router.route('/refresh').get(authController.refreshToken)
router.route('/reset-password').post(authJwt.verifyToken, authController.changeUserPassword)

module.exports = router
