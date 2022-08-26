'use strict'

const { compare } = require('bcryptjs')
const { isAlphanumeric, isLength, isNumeric, isEmail } = require('validator')
const { genSalt, hash } = require('bcryptjs')
const debug = require('debug')('dev')
const jwt = require('jsonwebtoken')
const User = require('../models/user.models')

// create jwt token
const createToken = (id) => {
    return jwt.sign(
        {
            id,
        },
        process.env.JWT_TOKEN_SECRET,
        {
            expiresIn: 24 * 60 * 60,
        }
    )
}

/**
 * when user login
 */
exports.userLogin = async (req, res) => {
    const { username, password } = req.body

    try {
        let passToCheck
        let currentUser

        // get user password by username
        const user = await User.findOne(
            isEmail(username) ? { email: username } : { username },
            'username name password email desc post followers following img_thumb img_bg'
        )
            .sort({ createdAt: -1 })
            .populate('post')
        if (!user) {
            if (isEmail(username)) {
                return res.status(404).json({ error: 'email not found' })
            } else {
                return res.status(404).json({ error: 'username not found' })
            }
        } else {
            passToCheck = user.password
            currentUser = user
        }

        // check if password valid
        const isValid = await compare(password, passToCheck)
        if (!isValid)
            return res.status(422).json({ error: 'password is invalid' })

        // create cookie with jwt token
        const token = createToken(currentUser._id)
        res.cookie('jwt', token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
        })

        // create current user
        req.user = currentUser
        return res.json(currentUser)
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message,
        })
    }
}

// register handler
exports.userRegister = async (req, res) => {
    const { username, email, password, gender, confirm_password } = req.body

    const error = []

    /** validate username */

    // cek if username exists
    if (!username) {
        return res.status(422).json({
            error: ['username required'],
        })
    }

    //cek if username valid
    !isLength(username, {
        min: 4,
        max: 15,
    })
        ? error.push('username must be more than 4 and less than 15 character')
        : isNumeric(username)
        ? error.push('username must contain alphabet')
        : !isAlphanumeric(username) &&
          error.push('username must not contain any special characters')

    /** validate email */

    // cek if email exists
    if (!email) {
        return res.status(422).json({
            error: ['email required'],
        })
    }

    /**  validate password */
    // cek if password exists
    if (!password) {
        return res.status(422).json({
            error: ['password required'],
        })
    }
    // cek password length
    if (password.length < 6) {
        error.push('password must be more than 6 characters')
    }
    // cek confirm password
    password !== confirm_password && error.push('confirm password not match')

    // send error if exist
    if (error.length > 0) {
        return res.status(422).json({
            error,
        })
    }

    try {
        // hash password
        let hashedPassword
        const salt = await genSalt()
        hashedPassword = await hash(password, salt)

        // set default user image profile
        let img_thumb
        gender === 'male'
            ? (img_thumb = 'https://i.ibb.co/jkKCvyd/male-avatar.png')
            : (img_thumb = 'https://i.ibb.co/sPWmJpy/female-avatar.png')

        // initialize new user collection
        const user = new User({
            img_thumb,
            email,
            gender,
            username,
            password: hashedPassword,
        })

        // save new user to db
        const savedUser = await user.save()

        // create cookie with jwt token
        const token = createToken(user._id)

        res.cookie('jwt', token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
        })

        // set current user in session
        req.user = savedUser
        res.json({
            message: 'new user added',
            data: savedUser,
        })
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message,
        })
    }
}

exports.userLogout = (req, res) => {
    res.send('logout user')
}

exports.isLoggedIn = (req, res) => {
    if (req.user) {
        res.json({
            isLoggedIn: true,
            user: req.user,
        })
    } else {
        if (req.cookies.jwt) {
            debug(req.cookies)
            // set currentUser from cookies
        } else {
            res.json({
                isLoggedIn: false,
            })
        }
    }
}
