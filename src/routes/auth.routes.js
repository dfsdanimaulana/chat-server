'use strict'

const router = require('express').Router()
const {
    userLogin,
    userLogout,
    userRegister,
    refreshToken,
    changeUserPassword
} = require('../controllers/auth.controller')

const { authJwt, verifySignUp } = require('../middleware')
const { validateData, checkDuplicateUsernameOrEmail } = verifySignUp
const { verifyToken } = authJwt

/* ============================ GET METHODS ============================ */
// refresh user access token when expired
router.get('/refresh', refreshToken)

/* ============================ POST METHODS ============================ */

router.post('/change_password', [verifyToken], changeUserPassword)
router.post('/login', userLogin)
router.post(
    '/register',
    [checkDuplicateUsernameOrEmail, validateData],
    userRegister
)
router.post('/logout', [verifyToken], userLogout)

/* ============================ PUT METHODS ============================ */
/* ============================ DELETE METHODS ============================ */

module.exports = router
