const debug = require('debug')('dev')
const httpStatus = require('http-status')
const db = require('../models')
const PostComment = db.comment
const Post = db.post

// get all comment
exports.getComments = async (req, res) => {
  try {
    const filters = {}
    const options = {}
    const populates = []

    const { sortBy, populate, postId } = req.query

    if (sortBy) {
      // sortBy=createdAt:desc
      const opt = {}
      sortBy
        .split(',')
        .map((val) => val.split(':'))
        .map((val) => (opt[val[0]] = val[1]))

      if (opt.createdAt) {
        if (opt.createdAt === 'desc') {
          options.createdAt = -1
        } else {
          options.createdAt = 1
        }
      }
    } else {
      options.createdAt = 1
    }

    if (postId) {
      filters.postId = postId
    }

    if (populate) {
      const populateOptions = ['sender', 'postId', 'like']
      // populate=user,comment:sender,like
      const opt = populate.split(',')

      populateOptions.forEach((val) => {
        if (opt.includes(val)) {
          populates.push(val)
        }
      })
    }

    const comments = await PostComment.find(filters).populate(populates).sort(options)
    if (!comments) {
      return res.status(404).json({ error: 'comments no found' })
    }

    res.status(200).json(comments)
  } catch (err) {
    debug(err)
    res.status(422).json({
      error: err.message
    })
  }
}

// create new comment
exports.createComment = async (req, res) => {
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
exports.getComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { populate } = req.query

    const populates = []

    if (populate) {
      const populateOptions = ['user', 'comment', 'like']
      // populate=comment,like,user
      const opt = populate.split(',')

      populateOptions.forEach((val) => {
        if (opt.includes(val)) {
          populates.push(val)
        }
      })
    }

    const comment = await PostComment.findById(commentId).populate(populates)
    if (!comment) {
      return res.status(404).json({ error: 'comment no found' })
    }

    res.json(comment)
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
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params

    // delete comment
    const deletedComment = await PostComment.findByIdAndDelete(commentId)

    // await deletedComment.removeCommentToPost(deletedComment.postId)
    // delete comment in post comment array
    await Post.findByIdAndUpdate(deletedComment.postId, {
      $pull: {
        comment: commentId
      }
    })

    res.status(httpStatus.NO_CONTENT).json({ message: 'comment deleted' })
  } catch (err) {
    debug({ err })
    res.status(400).json({ error: err.message })
  }
}
