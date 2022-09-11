'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Post = require('./post.model')

const postCommentSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    msg: {
      type: String,
      default: 'No Message'
    },
    like: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    replay: [
      {
        sender: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        msg: String
      }
    ]
  },
  {
    timestamps: true
  }
)

// push comment id to post collection array
postCommentSchema.methods.addCommentToPost = function (postId) {
  return Post.findByIdAndUpdate(
    { _id: postId },
    {
      $push: {
        comment: this._id
      }
    }
  )
}

// pull comment id in post collection array
postCommentSchema.methods.removeCommentToPost = function (postId) {
  return Post.findByIdAndUpdate(
    { _id: postId },
    {
      $pull: {
        comment: this._id
      }
    }
  )
}

const PostComment = mongoose.model('PostComment', postCommentSchema)

module.exports = PostComment
