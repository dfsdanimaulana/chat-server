const debug = require('debug')('dev')
const httpStatus = require('http-status')
const { isAlpha } = require('validator')
const { cloudinary } = require('../config/cloudinary')
const db = require('../models')
const Post = db.post
const User = db.user
const PostComment = db.comment

// get all post
exports.getPosts = async (req, res) => {
  try {
    const filters = {}
    const options = {}
    const populates = []

    const { sortBy, populate, userId } = req.query

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

    if (userId) {
      filters.user = userId
    }

    if (populate) {
      const populateOptions = ['user', 'comment', 'like']
      // populate=user,comment:sender,like
      const opt = populate.split(',')

      populateOptions.forEach((val) => {
        if (opt.includes(val)) {
          populates.push(val)
        }
      })
    }

    const posts = await Post.find(filters).populate(populates).sort(options)
    if (!posts) {
      return res.status(404).json({ error: 'posts no found' })
    }

    res.json(posts)
  } catch (error) {
    debug({ error })
    res.status(404).json({ error: error.message })
  }
}

// get all post
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params
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

    const post = await Post.findById(postId).populate(populates)
    if (!post) {
      return res.status(404).json({ error: 'posts no found' })
    }
    res.json(post)
  } catch (error) {
    debug({ error })
    res.status(404).json({ error: error.message })
  }
}

// create new post
exports.createPost = async (req, res) => {
  try {
    const { userId, caption, hashtag, image, uniqueId, video } = req.body

    // handle hashtag
    const arrHashtag = []

    if (hashtag) {
      // format string hashtag to array
      hashtag
        .split(' ')
        .filter((val) => val !== '')
        .map((val) => arrHashtag.push(val))
    }

    // create new post
    const post = new Post({
      user: userId,
      caption,
      uniqueId
    })

    // save post
    const savedPost = await post.save()

    // upload array of image one by one and save url to db
    if (image.length) {
      for (const img of image) {
        const uploadResponse = await cloudinary.uploader.upload(img, {
          upload_preset: process.env.CLOUDINARY_UPLOAD_POST
        })
        await Promise.all([post.addImgPostId([uploadResponse.public_id]), post.addImgPostUrl([uploadResponse.secure_url])])
      }
    }

    if (video) {
      // handle video
    }

    await Promise.all([
      post.addHashtag(arrHashtag),
      User.findByIdAndUpdate(userId, {
        $addToSet: {
          post: savedPost._id
        }
      })
    ])

    res.status(httpStatus.CREATED).json(savedPost)
  } catch (err) {
    res.status(400).json({ error: err.message, err })
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
    const { postId } = req.params

    const deletedPost = await Post.findByIdAndDelete(postId).populate('user')
    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found!' })
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
        post: postId,
        savedPost: postId
      }
    })

    // remove comments in deleted post
    await PostComment.deleteMany({
      postId
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
      return res.status(400).json({ error: 'postId and userId required!' })
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
exports.togglePostSave = async (req, res) => {
  try {
    const { userId, postId } = req.body

    if (!userId || !postId) {
      return res.status(400).json({ error: 'postId and userId required!' })
    }

    // check if user already save the selected post or not
    const user = await User.findById(userId)
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'user not found' })
    }

    let action = {
      $addToSet: {
        savedPost: {
          $each: [postId]
        }
      }
    }
    let message = 'post saved'

    if (user.savedPost.includes(postId)) {
      action = {
        $pull: {
          savedPost: postId
        }
      }

      message = 'post unsaved'
    }

    await User.updateOne({ _id: userId }, action)

    res.json({ message })
  } catch (err) {
    debug({ err })
    res.status(400).json({ error: err.message })
  }
}
