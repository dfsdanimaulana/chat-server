'use strict'

const debug = require('debug')('dev')
const { isEmail, isAlphanumeric, isLength, isNumeric } = require('validator')
const { genSalt, hash, compare } = require('bcryptjs')
const jwt = require('jsonwebtoken')

// user models
const User = require('../models/user.models')

// get all user in database
const getUsers = async (req, res) => {
    try {
        const user = await User.find(
            {},
            '_id username email gender desc followers following post img_thumb'
        )
        res.status(200).json(user)
    } catch (err) {
        debug(err)
        res.status(404).json({
            error: err.message,
        })
    }
}

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

// signup handler
const addUser = async (req, res) => {
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
        let img
        gender === 'male' ? (img = '/male.png') : (img = '/female.png')

        // initialize new user collection
        const user = new User({
            img,
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
            savedUser,
        })
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message,
        })
    }
}

/** When user signup end */

/**
 * when user login
 */
const checkUser = async (req, res) => {
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

const isLoggedIn = (req, res) => {
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

/** When user login end */

// update user by id

const updateUserData = async (req, res) => {
    try {
        const { id, queryString, data } = req.body
        let query = {}
        switch (queryString) {
            case 'username':
                // get all username's posts and update
                query = {
                    username: data,
                }
                break
            case 'email':
                query = {
                    email: data,
                }
                break
            case 'desc':
                query = {
                    desc: data,
                }
                break
            default:
                query = {}
        }
        const user = await User.findByIdAndUpdate(id, query, {
            new: true,
        })
        if (!user) {
            return res.status(404).json({
                error: 'user not found',
            })
        }
        res.json({
            message: 'update Success',
            user,
        })
    } catch (err) {
        debug({ err })
        res.status(404).json({
            error: err.message,
        })
    }
}

// remove user by id
const removeUser = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findByIdAndDelete(id)
        if (!user) {
            return res.status(404).json({
                error: 'user not found',
            })
        }
        res.json({
            message: `user with id=${user._id} and username=${user.username} has been deleted`,
        })
    } catch (err) {
        debug({ err })
        res.status(404).json({
            error: err.message,
        })
    }
}

const getUserWithPost = async (req, res) => {
    try {
        const user = await User.find().populate('post')
        res.json(user)
    } catch (err) {
        debug({ err })
        res.status(404).json({
            error: err.message,
        })
    }
}

const getUserById = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findById(
            id,
            'username email desc post followers following img_thumb img_bg'
        )
        res.json(user)
    } catch (err) {
        debug({ err })
        res.status(404).json({
            error: err.message,
        })
    }
}

// follower and following

const follow = async (req, res) => {
    try {
        // selanjutnya, userId akan diganti dengan id user yang sedang login
        const { followId, userId } = req.body
        if (userId === followId) {
            return res.status(442).json({
                error: 'Tidak boleh follow diri sendiri!',
            })
        }

        // cek apakah userid atau followid ada dalam database
        const user = await User.findById(userId)
        const followUser = await User.findById(followId)
        if (user === null) {
            return res.status(442).json({
                error: 'Kamu siapa?',
            })
        } else if (followUser === null) {
            return res.status(442).json({
                error: 'Kamu mau mengikuti siapa?',
            })
        }

        // cek apakah sudah mengikuti
        const existFollowers = followUser.followers.includes(userId)
        if (existFollowers) {
            return res.status(442).json({
                error: 'Sudah mengikuti',
            })
        }

        // lakukan follow dan following
        await User.findByIdAndUpdate(
            followId,
            {
                // pake addToSet biar id yang sama tidak masuk
                $addToSet: {
                    followers: userId,
                },
            },
            {
                new: true,
            }
        )
        await User.findByIdAndUpdate(
            userId,
            {
                $addToSet: {
                    following: followId,
                },
            },
            {
                new: true,
            }
        )
        res.json({
            message: 'Yeay! berhasil!',
        })
    } catch (error) {
        debug({ error })

        res.status(404).json({
            error: 'Yahh, gagal!',
        })
    }
}

// unfollow

const unFollow = async (req, res) => {
    try {
        // selanjutnya, userId akan diganti dengan id user yang sedang login
        const { unfollowId, userId } = req.body
        if (unfollowId === userId) {
            return res.status(442).json({
                error: 'Tidak boleh sama',
            })
        }

        // cek apakah userid atau followid ada dalam database
        const poorPerson = await User.findById(userId)
        const famousPerson = await User.findById(unfollowId)
        if (poorPerson === null) {
            return res.status(442).json({
                error: 'Kamu siapa?',
            })
        } else if (famousPerson === null) {
            return res.status(422).json({
                error: 'Siapa yang mau kamu unfollow?',
            })
        }

        // cek apakah belum mengikuti
        const existFollower = famousPerson.followers.includes(userId)
        if (!existFollower) {
            return res.status(442).json({
                error: 'Kamu belum mengikuti',
            })
        }

        // lakukan unfollow
        await User.findByIdAndUpdate(
            unfollowId,
            {
                $pull: {
                    followers: userId,
                },
            },
            {
                new: true,
            }
        )
        await User.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    following: unfollowId,
                },
            },
            {
                new: true,
            }
        )

        res.json({
            message: 'Success unfollow',
        })
    } catch (error) {
        debug({ error })
        res.status(404).json({
            error: 'Fail unfollow',
        })
    }
}

const followStatus = async (req, res) => {
    try {
        const user = await User.find(
            {},
            '_id username followers following'
        ).populate('followers following', 'username')
        res.json(user)
    } catch (error) {
        debug({ error })
        res.status(404).json({
            error: error.message,
        })
    }
}

module.exports = {
    getUsers,
    createToken,
    addUser,
    checkUser,
    isLoggedIn,
    updateUserData,
    removeUser,
    getUserWithPost,
    getUserById,
    follow,
    unFollow,
    followStatus,
}
