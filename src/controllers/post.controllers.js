'use strict'

const debug = require('debug')('dev')
const { cloudinary } = require('../config/cloudinary')
const Post = require('../models/post.models')
require('dotenv').config()

// create new post
exports.addPost = async (req, res) => {
    const { userId, caption, hashtag, image } = req.body
    // cek caption length

    if (caption.length > 100) {
        return res.json({ error: 'caption must be less than 100 character' })
    }

    // handle hashtag
    const arrHashtag = []

    if (hashtag) {
        // format string hashtag to array
        const hashtags = hashtag.split(' ')
        hashtags.map((val) => arrHashtag.push(val))
    }

    /**
     * array is not pushed when try to add to db
     * solved by put addImgPostId addImgPostUrl inside map
     */
    try {
        // create new post
        const post = new Post({
            user: userId,
            caption,
        })

        // save post
        const savedPost = await post.save()

        // loop every image and upload one by one
        image.map(async (img) => {
            const uploadResponse = await cloudinary.uploader.upload(img, {
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            })
            await post.addImgPostId([uploadResponse.public_id])

            // add img_post_url to post
            await post.addImgPostUrl([uploadResponse.secure_url])
        })

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

// menampilkan seluruh postingan
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

exports.removePost = async (req, res) => {
    try {
        const { id } = req.params
        const query = await Post.findByIdAndDelete(id)
        res.json({ message: 'post removed', query })
    } catch (error) {
        debug({ error })
        res.status(400).send(error)
    }
}

// get all user post by userid
exports.getUserPostById = async (req, res) => {
  try {
      const { userId } = req.params
      const userPosts = await Post.find({user: userId})
                  .sort({createdAt: -1})
                  .populate({
                    path: 'user',
                    select: 'username img_thumb'
                  })
      res.status(200).json(userPosts)
  } catch (err) {
    debug({err})
    res.status(400).json({error: err.message})
  }
}