'use strict'

const PostComment = require('../models/comment.models')
const debug = require('debug')('dev')

// get all comment
exports.getComments = async (req, res) => {
    try {
        const comments = await PostComment.find()
            .populate({
                path: 'sender',
                select: 'username img_thumb'
            })
            .populate({
                path: 'like',
                select: 'username img_thumb'
            })
            .sort({ createdAt: -1 })

        res.status(200).json(comments)
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message
        })
    }
}

// create new comment
exports.addComment = async (req, res) => {
    try {
        const { senderId, postId, msg } = req.body

        if (!senderId || !postId || !msg) {
            return res.status(400).json({ error: 'data not complete' })
        }

        const comment = new PostComment({
            sender: senderId,
            msg,
            postId
        })

        // save comment
        await comment.save()
        // add saved comment id to post comment array
        await comment.addCommentToPost(postId)

        res.json({ message: 'comment added' })
    } catch (err) {
        debug(err)
        res.status(422).json({
            error: err.message
        })
    }
}

// get comment by post id
exports.getCommentByPostId = async (req, res) => {
    try {
        const postId = req.params.id

        const data = await PostComment.find({
            postId
        }).populate({
            path: 'sender',
            select: 'username img_thumb'
        })

        res.json(data)
    } catch (error) {
        debug(error)
        res.status(400).json({ error: error.message })
    }
}

// like comment di postingan
exports.likeComment = (req, res, next) => {
    try {
        const { userId, postId } = req.body
        const addLike = PostComment.findByIdAndUpdate(postId, {
            $addToSet: {
                like: {
                    _id: userId
                }
            }
        })
        debug(addLike)
        next()
    } catch (error) {
        debug({ error })
        res.status(400).json({ error: 'like gagal' })
    }
}

// unlike comment di postingan
exports.unlikeComment = (req, res, next) => {
    try {
        const { userId, postId } = req.body
        const minLike = PostComment.findByIdAndUpdate(postId, {
            $pull: {
                like: {
                    _id: userId
                }
            }
        })
        debug(minLike)
        next()
    } catch (error) {
        debug({ error })
        res.status(400).json({ error: 'unlike gagal' })
    }
}
