'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const moment = require('moment')
const Post = require('./post.models.js')

const postCommentSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        timeSend: {
            type: String,
            default: moment().format('hh:mm A'),
        },
        msg: {
            type: String,
            maxlength: [100,'message must be less than 100 character'],
            default: 'No Message',
        },
        like: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
)

// push comment id to post collection array
postCommentSchema.methods.addCommentToPost = function (postId) {
    return Post.findByIdAndUpdate(
        { _id: postId },
        {
            $push: {
                comment: this._id,
            },
        }
    )
}

const PostComment = mongoose.model('PostComment', postCommentSchema)

module.exports = PostComment