'use strict'

const router = require('express').Router()
const {
    userLogin,
    userLogout,
    userRegister,
} = require('../controllers/auth.controllers')

router.post('/login', userLogin)
router.post('/register', userRegister)
router.post('/logout', userLogout)

module.exports = router
