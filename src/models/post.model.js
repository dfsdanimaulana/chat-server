'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const User = require('./user.model')

const postSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uniqueId: {
      type: String,
      unique: true
    },
    img_post_id: [
      {
        type: String
      }
    ],
    img_post_url: [
      {
        type: String
      }
    ],
    caption: {
      type: String,
      maxlength: [100, 'caption must be less than 100 characters'],
      default: 'No Caption',
      required: true
    },
    hashtag: [
      {
        type: String
      }
    ],
    comment: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PostComment'
      }
    ],
    like: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
)

// post methods

// push post id to user collection post array
postSchema.methods.addToUserPost = function (userId) {
  return User.findByIdAndUpdate(
    { _id: userId },
    {
      $addToSet: {
        post: this._id
      }
    }
  )
}

// add array formatted hashtag
postSchema.methods.addHashtag = function (arr) {
  return Post.updateOne(
    { _id: this.id },
    {
      $addToSet: {
        hashtag: {
          $each: arr
        }
      }
    }
  )
}

// add array formatted img_post_id
postSchema.methods.addImgPostId = function (arr) {
  return Post.updateOne(
    { _id: this.id },
    {
      $addToSet: {
        img_post_id: {
          $each: arr
        }
      }
    }
  )
}

// add array formatted img_post_url
postSchema.methods.addImgPostUrl = function (arr) {
  return Post.updateOne(
    { _id: this.id },
    {
      $addToSet: {
        img_post_url: {
          $each: arr
        }
      }
    }
  )
}

// add user id to like array
postSchema.methods.likePost = function (arr) {
  return Post.updateOne(
    { _id: this.id },
    {
      $addToSet: {
        like: {
          $each: arr
        }
      }
    }
  )
}

// remove user id to like array
postSchema.methods.unlikePost = function (userId) {
  return Post.updateOne(
    { _id: this.id },
    {
      $pull: {
        like: userId
      }
    }
  )
}

const Post = mongoose.model('Post', postSchema)

module.exports = Post
