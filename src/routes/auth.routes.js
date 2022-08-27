'use strict'

const router = require('express').Router()
const {
    userLogin,
    userLogout,
    userRegister,
    isLoggedIn,
    refreshToken
} = require('../controllers/auth.controllers')
const { verifyToken } = require('../middleware/verifyToken')

router.post('/login', userLogin)
router.post('/register', userRegister)
router.post('/logout', userLogout)
router.post('/refresh', refreshToken)
router.get('/', verifyToken, isLoggedIn)

module.exports = router
