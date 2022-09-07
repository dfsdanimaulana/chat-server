'use strict'

const User = require('../models/user.model')
const { compare } = require('bcryptjs')

const matchPassword = async (req, res, next) => {
    const { userId, password } = req.body

    try {
        const user = await User.findById(userId)
        const isMatch = await compare(password, user.password)
        if (isMatch) {
            next()
        } else {
            res.status(442).json({ error: 'incorrect password' })
        }
    } catch (error) {
        res.status(400).json({ error: 'match password error', error })
    }
}

module.exports = { matchPassword }
