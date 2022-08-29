'use strict'

const router = require('express').Router()
const {
    userLogin,
    userLogout,
    userRegister,
    isLoggedIn,
    refreshToken,
    changeUserPassword,
} = require('../controllers/auth.controllers')
const { verifyToken } = require('../middleware/verifyToken')

router.post('/change_password', verifyToken, changeUserPassword)
router.post('/login', userLogin)
router.post('/register', userRegister)
router.post('/logout', verifyToken, userLogout)
router.get('/refresh', refreshToken)
router.get('/', verifyToken, isLoggedIn)

module.exports = router
