'use strict'

const debug = require('debug')('dev')

const db = require('../models')
const PostComment = db.comment
const Post = db.post

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
        const savedComment = await comment.save()
        // add saved comment id to post comment array
        // await comment.addCommentToPost(postId)
        await Post.findByIdAndUpdate(postId, {
            $push: {
                comment: savedComment._id
            }
        })

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
    } catch (err) {
        debug({ err })
        res.status(400).json({ error: err.message })
    }
}

// delete comment by id
exports.deleteCommentById = async (req, res) => {
    try {
        const { id } = req.params

        // delete comment
        const deletedComment = await PostComment.findByIdAndDelete(id)

        // await deletedComment.removeCommentToPost(deletedComment.postId)
        // delete comment in post comment array
        await Post.findByIdAndUpdate(deletedComment.postId, {
            $pull: {
                comment: id
            }
        })

        res.status(200).json({ message: 'comment deleted' })
    } catch (err) {
        debug({ err })
        res.status(400).json({ error: err.message })
    }
}
