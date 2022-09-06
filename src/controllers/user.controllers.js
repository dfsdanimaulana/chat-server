'use strict'

// user models
const User = require('../models/user.models')
const debug = require('debug')('dev')
const { cloudinary } = require('../config/cloudinary')

// get all user in database
exports.getUsers = async (req, res) => {
    try {
        const user = await User.find(
            {},
            '_id username name email gender desc followers following post img_thumb img_thumb_id'
        )
        res.status(200).json(user)
    } catch (err) {
        debug(err)
        res.status(404).json({
            error: err.message
        })
    }
}

// update user data
exports.updateUser = async (req, res) => {
    try {
        const { username, name, email, desc, gender, _id } = req.body

        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { username, name, email, desc, gender },
            {
                new: true
            }
        )

        const { password, createdAt, updatedAt, post, ...rest } =
            updatedUser._doc

        res.status(200).json(rest)
    } catch (err) {
        debug(err)
        res.status(404).json({
            error: err.message
        })
    }
}

// update user profile picture
exports.updateProfilePic = async (req, res) => {
    try {
        const { image, id, publicId } = req.body

        if (!image || !id) {
            return res.status(400).json({ error: 'data not complete' })
        }

        // remove old pic in cloudinary
        if (publicId && publicId !== 'new') {
            await cloudinary.uploader.destroy(publicId)
        }

        // upload to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image, {
            upload_preset: process.env.CLOUDINARY_UPLOAD_PIC
        })

        await User.findByIdAndUpdate(id, {
            img_thumb: uploadResponse.secure_url,
            img_thumb_id: uploadResponse.public_id
        })

        res.status(200).json({
            message: 'Update success',
            img_thumb: uploadResponse.secure_url
        })
    } catch (err) {
        debug(err)
        res.status(404).json({
            error: err.message
        })
    }
}

// remove user by id
exports.removeUser = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findByIdAndDelete(id)
        if (!user) {
            return res.status(404).json({
                error: 'user not found'
            })
        }
        res.json({
            message: `user with id=${user._id} and username=${user.username} has been deleted`
        })
    } catch (err) {
        debug({ err })
        res.status(404).json({
            error: err.message
        })
    }
}

exports.getUserWithPost = async (req, res) => {
    try {
        const user = await User.find().populate('post')
        res.json(user)
    } catch (err) {
        debug({ err })
        res.status(404).json({
            error: err.message
        })
    }
}

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findById(
            id,
            'username name password email gender desc followers following img_thumb img_thumb_id img_bg savedPost'
        ).populate({
            path: 'savedPost',
            populate: 'like comment'
        })

        // send except password
        const { password, ...rest } = user._doc

        return res.json({ ...rest })
        res.json(user)
    } catch (err) {
        debug({ err })
        res.status(404).json({
            error: err.message
        })
    }
}

// follower and following

exports.follow = async (req, res) => {
    try {
        // selanjutnya, userId akan diganti dengan id user yang sedang login
        const { followId, userId } = req.body
        if (userId === followId) {
            return res.status(442).json({
                error: 'Tidak boleh follow diri sendiri!'
            })
        }

        // cek apakah userid atau followid ada dalam database
        const user = await User.findById(userId)
        const followUser = await User.findById(followId)
        if (user === null) {
            return res.status(442).json({
                error: 'Kamu siapa?'
            })
        } else if (followUser === null) {
            return res.status(442).json({
                error: 'Kamu mau mengikuti siapa?'
            })
        }

        // cek apakah sudah mengikuti
        const existFollowers = followUser.followers.includes(userId)
        if (existFollowers) {
            return res.status(442).json({
                error: 'Sudah mengikuti'
            })
        }

        // lakukan follow dan following
        await User.findByIdAndUpdate(
            followId,
            {
                // pake addToSet biar id yang sama tidak masuk
                $addToSet: {
                    followers: userId
                }
            },
            {
                new: true
            }
        )
        await User.findByIdAndUpdate(
            userId,
            {
                $addToSet: {
                    following: followId
                }
            },
            {
                new: true
            }
        )
        res.json({
            message: 'Yeay! berhasil!'
        })
    } catch (error) {
        debug({ error })

        res.status(404).json({
            error: 'Yahh, gagal!'
        })
    }
}

// unfollow

exports.unFollow = async (req, res) => {
    try {
        // selanjutnya, userId akan diganti dengan id user yang sedang login
        const { unfollowId, userId } = req.body
        if (unfollowId === userId) {
            return res.status(442).json({
                error: 'Tidak boleh sama'
            })
        }

        // cek apakah userid atau followid ada dalam database
        const poorPerson = await User.findById(userId)
        const famousPerson = await User.findById(unfollowId)
        if (poorPerson === null) {
            return res.status(442).json({
                error: 'Kamu siapa?'
            })
        } else if (famousPerson === null) {
            return res.status(422).json({
                error: 'Siapa yang mau kamu unfollow?'
            })
        }

        // cek apakah belum mengikuti
        const existFollower = famousPerson.followers.includes(userId)
        if (!existFollower) {
            return res.status(442).json({
                error: 'Kamu belum mengikuti'
            })
        }

        // lakukan unfollow
        await User.findByIdAndUpdate(
            unfollowId,
            {
                $pull: {
                    followers: userId
                }
            },
            {
                new: true
            }
        )
        await User.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    following: unfollowId
                }
            },
            {
                new: true
            }
        )

        res.json({
            message: 'Success unfollow'
        })
    } catch (error) {
        debug({ error })
        res.status(404).json({
            error: 'Fail unfollow'
        })
    }
}

exports.followStatus = async (req, res) => {
    try {
        const user = await User.find(
            {},
            '_id username followers following'
        ).populate('followers following', 'username')
        res.json(user)
    } catch (error) {
        debug({ error })
        res.status(404).json({
            error: error.message
        })
    }
}
