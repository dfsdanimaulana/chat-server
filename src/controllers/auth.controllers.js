'use strict'

const { compare } = require('bcryptjs')
const { isAlphanumeric, isLength, isNumeric, isEmail } = require('validator')
const { genSalt, hash } = require('bcryptjs')
const debug = require('debug')('dev')
const jwt = require('jsonwebtoken')
const User = require('../models/user.models')

const refreshTokens = []

// create jwt token
const createToken = (id, username) => {
    return jwt.sign(
        {
            id,
            username,
        },
        process.env.JWT_TOKEN_SECRET,
        {
            expiresIn: '15m',
        }
    )
}
// create jwt refresh token
const createRefreshToken = (id, username) => {
    return jwt.sign(
        {
            id,
            username,
        },
        process.env.JWT_REFRESH_TOKEN_SECRET
    )
}

/**
 * when user login
 */
exports.userLogin = async (req, res) => {
    const { username, password: inputPassword } = req.body
    try {
        // get user password by username
        const user = await User.findOne(
            isEmail(username) ? { email: username } : { username },
            'username name password email desc followers following img_thumb img_bg'
        )
        if (!user) {
            if (isEmail(username)) {
                return res.status(404).json({ error: 'email not found' })
            } else {
                return res.status(404).json({ error: 'username not found' })
            }
        }

        // check if password valid
        const isValid = await compare(inputPassword, user.password)
        if (!isValid)
            return res.status(422).json({ error: 'password is invalid' })

        // create cookie with jwt token
        const token = createToken(user._id, user.username)
        const refreshToken = createRefreshToken(user._id, user.username)
        refreshTokens.push(refreshToken)

        res.cookie('jwt', token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
        })

        // create current user
        const { password, ...rest } = user._doc
        return res.json(rest)
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
        const token = createToken(user._id, user.username)

        res.cookie('jwt', token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
        })

        res.json(savedUser)
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

// check if request is contain jwt cookies
exports.isLoggedIn = async (req, res) => {
    const { id, username } = req.user

    try {
        // get user password by username
        const user = await User.findOne(
            { username },
            'username name email desc followers following img_thumb img_bg'
        )
        if (!user) {
            return res.status(404).json({ error: 'username not found' })
        }

        res.status(200).json(user)
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message,
        })
    }
}

// refresh jwt token
exports.refreshToken = (req, res) => {
    const authHeader = req.headers['authorization']

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' })
    }

    const rToken = authHeader.split(' ')[1]
    if (rToken === 'null') {
        return res.status(401).json({ message: 'Token is null' })
    }
    res.send(200).json(rToken)
}