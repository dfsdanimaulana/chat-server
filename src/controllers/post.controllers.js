'use strict'

const debug = require('debug')('dev')
const { cloudinary } = require('../config/cloudinary')
const Post = require('../models/post.models')
const { isAlpha } = require('validator')

// create new post
exports.addPost = async (req, res) => {
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
            uniqueId,
        })

        // save post
        const savedPost = await post.save()

        // upload array of image one by one and save url to db
        for (const img of image) {
            const uploadResponse = await cloudinary.uploader.upload(img, {
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            })
            await post.addImgPostId([uploadResponse.public_id])
            await post.addImgPostUrl([uploadResponse.secure_url])
        }

        // add hashtag to post
        if (arrHashtag.length > 0) {
            await post.addHashtag(arrHashtag)
        }

        // save post id to user post array
        await post.addToUserPost(userId)

        res.status(200).json({ message: 'posted!', data: savedPost })
    } catch (err) {
        res.status(400).json({ error: 'failed add post to user post', err })
    }
}

// get all post
exports.getPost = async (req, res) => {
    try {
        const data = await Post.find({})
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: 'username img_thumb',
            })
            .populate({
                path: 'comment',
                select: 'sender timeSend like msg',
                populate: {
                    path: 'sender',
                    select: 'username img_thumb',
                },
            })
        res.json(data)
    } catch (error) {
        debug({ error })
        res.status(404).json({ error: error.message })
    }
}

exports.updatePostCaption = (req, res) => {
    try {
        const { caption, id } = req.body
        const query = Post.findByIdAndUpdate(
            id,
            {
                $set: {
                    caption,
                },
            },
            {
                new: true,
            }
        )
        res.json(query)
    } catch (error) {
        debug({ error })
        res.status(404).json({ error: error.message })
    }
}

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params
        const deletedPost = await Post.findByIdAndDelete(id)
        if (!deletedPost) {
            res.status(404).json({ error: 'Post not found!' })
        }

        const publicId = deletedPost.img_post_id
        // delete image in cloudinary
        // remove post id in user post filed
        // remove post id in user saved post field

        res.json({ message: 'post deleted!', publicId })
    } catch (error) {
        debug({ error })
        res.status(400).json({ error: error.message })
    }
}

// get all user post by userid
exports.getUserPostById = async (req, res) => {
    try {
        const { userId } = req.params
        const userPosts = await Post.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: 'username img_thumb',
            })
        res.status(200).json(userPosts)
    } catch (err) {
        debug({ err })
        res.status(400).json({ error: err.message })
    }
}
