'use strict'

const { compare } = require('bcryptjs')
const { isAlphanumeric, isLength, isNumeric, isEmail } = require('validator')
const { genSalt, hash } = require('bcryptjs')
const debug = require('debug')('dev')
const jwt = require('jsonwebtoken')
const db = require('../models')
const User = db.user

let refreshTokens = [] // array of String token

// create jwt token
const createToken = (id, username) => {
    return jwt.sign(
        {
            id,
            username
        },
        process.env.JWT_TOKEN_SECRET,
        {
            expiresIn: '15m'
        }
    )
}

// create jwt refresh token
const createRefreshToken = (id, username) => {
    return jwt.sign(
        {
            id,
            username
        },
        process.env.JWT_REFRESH_TOKEN_SECRET
    )
}

// refresh jwt token
exports.refreshToken = (req, res) => {
    const rToken = req.cookies.jwt

    if (!rToken) {
        return res.status(401).json({ error: 'Token is null' })
    }

    if (!refreshTokens.includes(rToken)) {
        return res
            .status(403)
            .json({ error: 'Token is not valid or not exist!' })
    }

    jwt.verify(rToken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Token is not valid!'
            })
        }

        // delete the old refreshToken
        refreshTokens = refreshTokens.filter((token) => token !== rToken)

        const newAccessToken = createToken(user.id, user.username)
        const newRefreshToken = createRefreshToken(user.id, user.username)
        refreshTokens.push(newRefreshToken)

        res.cookie('jwt', newRefreshToken, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        res.status(200).json({
            accessToken: newAccessToken
        })
    })
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
            'username name password email gender desc followers following img_thumb img_thumb_id img_bg savedPost'
        ).populate({
            path: 'savedPost'
        })

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
        const accessToken = createToken(user._id, user.username)
        const refreshToken = createRefreshToken(user._id, user.username)
        refreshTokens.push(refreshToken)

        res.cookie('jwt', refreshToken, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        // send except password
        const { password, ...rest } = user._doc

        return res.json({ ...rest, accessToken, refreshToken })
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message
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
            error: ['username required']
        })
    }
    if (password !== confirm_password) {
        return res.status(422).json({
            error: ['wrong confirm password!']
        })
    }

    //cek if username valid
    !isLength(username, {
        min: 4,
        max: 15
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
            error: ['email required']
        })
    }

    /**  validate password */
    // cek if password exists
    if (!password) {
        return res.status(422).json({
            error: ['password required']
        })
    }
    // cek password length
    if (password.length < 6) {
        error.push('password must be more than 6 characters')
    }

    // send error if exist
    if (error.length > 0) {
        return res.status(422).json({
            error
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
            ? (img_thumb =
                  'https://res.cloudinary.com/dfsdanimaulana/image/upload/v1661665020/thumbnails/male_avatar_kzr9sl.png')
            : (img_thumb =
                  'https://res.cloudinary.com/dfsdanimaulana/image/upload/v1661665008/thumbnails/female_avatar_tu9zdg.png')

        // initialize new user collection
        const user = new User({
            img_thumb,
            email,
            gender,
            username,
            password: hashedPassword
        })

        // save new user to db
        const savedUser = await user.save()

        res.json(savedUser) // redirect to /login
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message
        })
    }
}

exports.userLogout = (req, res) => {
    res.send('logout user')
}

// change password
exports.changeUserPassword = async (req, res) => {
    const { _id, password_old, password_new, password_new_confirm } = req.body

    try {
        // get user old password
        const user = await User.findById(_id, 'password')
        if (!user) {
            return res.status(422).json({
                error: ['User not found!']
            })
        }

        // check old password
        const isValid = await compare(password_old, user.password)
        if (!isValid) {
            return res.status(422).json({
                error: ['Invalid old password!']
            })
        }

        /**  validate password */

        // cek if password exists
        if (!password_old || !password_new || !password_new_confirm) {
            return res.status(422).json({
                error: ['password required']
            })
        }

        if (password_new !== password_new_confirm) {
            return res.status(422).json({
                error: ['wrong confirm password!']
            })
        }

        const error = []

        // cek password length
        if (password_new.length < 6) {
            error.push('password must be more than 6 characters')
        }

        // send error if exist
        if (error.length > 0) {
            return res.status(422).json({
                error
            })
        }

        // hash new password
        // hash password
        let hashedPassword
        const salt = await genSalt()
        hashedPassword = await hash(password_new, salt)

        await User.findByIdAndUpdate(_id, {
            password: hashedPassword
        })

        res.status(200).json({ message: 'Password updated!' })
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: [err.message]
        })
    }
}
