'use strict'

const { isAlphanumeric, isLength, isNumeric } = require('validator')
const db = require('../models')
const User = db.user
const ROLES = db.ROLES

exports.validateData = (req, res, next) => {
    const { username, email, password, gender, confirm_password } = req.body

    /** validate username */

    // cek if username exists
    if (!username) {
        return res.status(422).json({
            error: 'username required'
        })
    }
    if (password !== confirm_password) {
        return res.status(422).json({
            error: 'wrong confirm password!'
        })
    }

    // validate username

    if (
        !isLength(username, {
            min: 4,
            max: 15
        })
    ) {
        return res.status(422).json({
            error: 'username must be more than 4 and less than 15 character'
        })
    }

    if (isNumeric(username)) {
        return res.status(422).json({
            error: 'username must contain alphabet'
        })
    }

    if (!isAlphanumeric(username)) {
        return res.status(422).json({
            error: 'username must not contain any special characters'
        })
    }

    /** validate email */

    // cek if email exists
    if (!email) {
        return res.status(422).json({
            error: 'email required!'
        })
    }

    /**  validate password */
    // cek if password exists
    if (!password) {
        return res.status(422).json({
            error: 'password required!'
        })
    }
    // cek password length
    if (password.length < 6) {
        return res.status(422).json({
            error: 'password must be more than 6 characters'
        })
    }

    /** validate gender */
    if (!gender) {
        return res.status(422).json({
            error: 'gender required!'
        })
    }

    next()
}

exports.checkDuplicateUsernameOrEmail = (req, res, next) => {
    const { username, email } = req.body

    // Username
    User.findOne({
        username
    }).exec((err, user) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        if (user) {
            res.status(400).json({
                error: 'Failed! Username is already in use!'
            })
            return
        }
        // Email
        User.findOne({
            email
        }).exec((err, user) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            if (user) {
                res.status(400).json({
                    error: 'Failed! Email is already in use!'
                })
                return
            }
            next()
        })
    })
}

exports.checkRolesExisted = (req, res, next) => {
    if (req.body.roles) {
        for (let i = 0; i < req.body.roles.length; i++) {
            if (!ROLES.includes(req.body.roles[i])) {
                res.status(400).json({
                    message: `Failed! Role ${req.body.roles[i]} does not exist!`
                })
                return
            }
        }
    }
    next()
}
