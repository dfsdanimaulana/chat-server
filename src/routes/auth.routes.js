'use strict'

const router = require('express').Router()
const { verifyToken } = require('../middleware/verifyToken')
const {
    userLogin,
    userLogout,
    userRegister,
    refreshToken,
    changeUserPassword
} = require('../controllers/auth.controllers')

/* ============================ GET METHODS ============================ */
// refresh user access token when expired
router.get('/refresh', refreshToken)

/* ============================ POST METHODS ============================ */

router.post('/change_password', verifyToken, changeUserPassword)
router.post('/login', userLogin)
router.post('/register', userRegister)
router.post('/logout', verifyToken, userLogout)

/* ============================ PUT METHODS ============================ */
/* ============================ DELETE METHODS ============================ */

module.exports = router
