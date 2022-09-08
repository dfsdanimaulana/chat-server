'use strict'

const debug = require('debug')('dev')
const { isAlpha } = require('validator')
const { cloudinary } = require('../config/cloudinary')
const db = require('../models')
const Post = db.post
const User = db.user
const PostComment = db.comment

// get all post
exports.getPost = async (req, res) => {
    try {
        const data = await Post.find({})
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: 'username img_thumb'
            })
            .populate({
                path: 'comment',
                select: 'sender timeSend like msg',
                populate: {
                    path: 'sender',
                    select: 'username img_thumb'
                }
            })
            .populate({
                path: 'like',
                select: 'username img_thumb'
            })
        res.json(data)
    } catch (error) {
        debug({ error })
        res.status(404).json({ error: error.message })
    }
}

// get all post
exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params

        const data = await Post.findById(id)
            .populate({
                path: 'user',
                select: 'username img_thumb'
            })
            .populate({
                path: 'comment',
                select: 'sender timeSend like msg',
                populate: {
                    path: 'sender',
                    select: 'username img_thumb'
                }
            })
            .populate({
                path: 'like',
                select: 'username img_thumb'
            })
        res.status(200).json(data)
    } catch (error) {
        debug({ error })
        res.status(404).json({ error: error.message })
    }
}

// create new post
exports.createNewPost = async (req, res) => {
    const { userId, caption, hashtag, image, uniqueId } = req.body

    // check if image is not empty
    if (!image || image.length < 1) {
        return res.status(400).json({ error: 'please select an image' })
    }

    // cek caption length
    if (caption.length > 100) {
        return res
            .status(400)
            .json({ error: 'caption must be less than 100 character' })
    }

    // uniqueId must be only alphabet
    if (!isAlpha(uniqueId)) {
        return res
            .status(400)
            .json({ error: 'uniqueId must only contain alphabet' })
    }

    // handle hashtag
    const arrHashtag = []

    if (hashtag) {
        // format string hashtag to array
        const hashtags = hashtag.split(' ')
        hashtags.filter((val) => val !== '').map((val) => arrHashtag.push(val))
    }

    try {
        // create new post
        const post = new Post({
            user: userId,
            caption,
            uniqueId
        })

        // save post
        const savedPost = await post.save()

        // upload array of image one by one and save url to db
        for (const img of image) {
            const uploadResponse = await cloudinary.uploader.upload(img, {
                upload_preset: process.env.CLOUDINARY_UPLOAD_POST
            })
            await post.addImgPostId([uploadResponse.public_id])
            await post.addImgPostUrl([uploadResponse.secure_url])
        }

        // add hashtag to post
        if (arrHashtag.length > 0) {
            await post.addHashtag(arrHashtag)
        }

        // save post id to user post array
        await User.findByIdAndUpdate(userId, {
            $addToSet: {
                post: savedPost._id
            }
        })

        res.status(200).json({ message: 'posted!', data: savedPost })
    } catch (err) {
        res.status(400).json({ error: 'failed add post to user post', err })
    }
}

exports.updatePostCaption = (req, res) => {
    try {
        const { caption, id } = req.body
        const query = Post.findByIdAndUpdate(
            id,
            {
                $set: {
                    caption
                }
            },
            {
                new: true
            }
        )
        res.json(query)
    } catch (error) {
        debug({ error })
        res.status(404).json({ error: error.message })
    }
}

// delete post by id
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params

        const deletedPost = await Post.findByIdAndDelete(id).populate('user')
        if (!deletedPost) {
            res.status(404).json({ error: 'Post not found!' })
        }

        const publicId = deletedPost.img_post_id

        // delete image in cloudinary
        for (const pbId of publicId) {
            await cloudinary.uploader.destroy(pbId)
        }

        // remove post id in user post filed and user savedPost field
        const userId = deletedPost.user._id
        await User.findByIdAndUpdate(userId, {
            $pull: {
                post: id,
                savedPost: id
            }
        })

        // remove comments in deleted post
        await PostComment.deleteMany({
            postId: id
        })

        res.json({ message: 'post deleted!' })
    } catch (error) {
        debug({ error })
        res.status(400).json({ error: error.message })
    }
}

// get all user post by userId
exports.getUserPostById = async (req, res) => {
    try {
        const { userId } = req.params
        const userPosts = await Post.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: 'username img_thumb'
            })
            .populate({
                path: 'like',
                select: 'username img_thumb'
            })
        res.status(200).json(userPosts)
    } catch (err) {
        debug({ err })
        res.status(400).json({ error: err.message })
    }
}

// toggle post like
exports.togglePostLike = async (req, res) => {
    try {
        const { userId, postId } = req.body

        if (!userId || !postId) {
            return res
                .status(400)
                .json({ error: 'postId and userId required!' })
        }

        // check if user already like the post or not
        const postLike = await Post.findById(postId, 'like')
        if (postLike.like.includes(userId)) {
            // unlike post
            await postLike.unlikePost(userId)
            res.status(200).json({ message: 'unlike success' })
        } else {
            // like post
            await postLike.likePost([userId])
            res.status(200).json({ message: 'like success' })
        }
    } catch (err) {
        debug({ err })
        res.status(400).json({ error: err.message })
    }
}

// toggle save post in user saved post field
exports.toggleUserSavedPost = async (req, res) => {
    try {
        const { userId, postId } = req.body

        if (!userId || !postId) {
            return res
                .status(400)
                .json({ error: 'postId and userId required!' })
        }

        // check if user already save the selected post or not
        const user = await User.findById(userId, 'savedPost')

        if (user.savedPost.includes(postId)) {
            // unsaved selected post
            await User.updateOne(
                { _id: userId },
                {
                    $pull: {
                        savedPost: postId
                    }
                }
            )

            res.status(200).json({ message: 'post unsaved' })
        } else {
            // save selected post
            await User.updateOne(
                { _id: userId },
                {
                    $addToSet: {
                        savedPost: {
                            $each: [postId]
                        }
                    }
                }
            )

            res.status(200).json({ message: 'post saved' })
        }
    } catch (err) {
        debug({ err })
        res.status(400).json({ error: err.message })
    }
}