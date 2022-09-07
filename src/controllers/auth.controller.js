'use strict'

const { compare } = require('bcryptjs')
const { isEmail } = require('validator')
const { genSalt, hash } = require('bcryptjs')
const debug = require('debug')('dev')
const jwt = require('jsonwebtoken')
const db = require('../models')
const User = db.user
const Role = db.role

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
            expiresIn: '5m'
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
            isEmail(username) ? { email: username } : { username }
        )
            .populate('roles', '-__v')
            .populate({
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

        const authorities = []
        for (let i = 0; i < user.roles.length; i++) {
            authorities.push('ROLE_' + user.roles[i].name.toUpperCase())
        }

        // send except password
        const { password, ...rest } = user._doc

        return res.json({
            ...rest,
            accessToken,
            refreshToken,
            roles: authorities
        })
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message
        })
    }
}

// register new user
exports.userRegister = async (req, res) => {
    const { username, email, password, gender, roles } = req.body

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

        // check if rules given
        if (roles) {
            const userRoles = await Role.find({
                name: {
                    $in: roles
                }
            })

            user.roles = userRoles.map((role) => role._id)
        } else {
            const userRoles = await Role.findOne({
                name: 'user'
            })

            user.roles = [userRoles._id]
        }

        // save new user to db
        await user.save()

        res.status(200).json({ message: 'new user created' }) // redirect to /login
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
