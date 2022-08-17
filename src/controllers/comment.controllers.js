'use strict'

const PostComment = require('../models/comment.models')
const Post = require('../models/post.models')
const debug = require('debug')('dev')

exports.addComment = (req, res) => {
    const { senderId, postId, msg } = req.body

    if (!senderId || !postId || !msg) {
        return res.status(400).json({ error: 'data not complete' })
    }

    const comment = new PostComment({
        sender: senderId,
        msg,
    })

    comment.save(async (error, result) => {
        if (error) {
            return res.status(400).json({ error: error.message })
        }
        const saveComment = await comment.addCommentToPost(postId)
        if (!saveComment) {
            return res.status(400).json({ error: 'failed to add comment' })
        }
        res.json({ message: 'comment added', result })
    })
}

exports.getCommentByPostId = async (req, res) => {
    try {
        const  postId  = req.params.id
        debug({postId})
        const data = await Post.findById(postId, 'comment').populate({
            path: 'comment',
            populate: {
                path: 'sender',
                select: 'username img_thumb'
            }
        })
        debug(data.comment[0].sender)
        res.json(data)
    } catch (error) {
        debug(error)
        res.status(400).json({error:error.message})
    }
}

// like comment di postingan
exports.likeComment = (req, res, next) => {
    try {
        const { userId, postId } = req.body
        const addLike = PostComment.findByIdAndUpdate(postId, {
            $addToSet: {
                like: {
                    _id: userId,
                },
            },
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
                    _id: userId,
                },
            },
        })
        debug(minLike)
        next()
    } catch (error) {
        debug({ error })
        res.status(400).json({ error: 'unlike gagal' })
    }
}
