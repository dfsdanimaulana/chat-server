const debug = require('debug')('dev')
const httpStatus = require('http-status')
const { cloudinary } = require('../config/cloudinary')
const db = require('../models')
const User = db.user

// get all user in database
exports.getUsers = async (req, res) => {
  try {
    const filters = {}
    const options = {}
    const populates = []

    const { sortBy, username, populate } = req.query

    if (sortBy) {
      // sortBy=createdAt:desc,username:desc
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

      if (opt.username) {
        if (opt.username === 'desc') {
          options.username = -1
        } else {
          options.username = 1
        }
      }
    } else {
      options.createdAt = 1
    }

    if (username) {
      filters.username = username
    }

    if (populate) {
      const populateOptions = ['post', 'savedPost', 'roles']
      // populate=roles
      const opt = populate.split(',')

      populateOptions.forEach((val) => {
        if (opt.includes(val)) {
          populates.push(val)
        }
      })
    }
    
    const users = await User.find(filters).populate(populates).sort(options)
    if (!users) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'users not found' })
    }
    const [...datas] = users
    const filteredDatas = []

    datas.map((data) => {
      const { password, __v, createdAt, updatedAt, ...newData } = data._doc
      filteredDatas.push(newData)
    })

    res.json(filteredDatas)
  } catch (err) {
    debug(err)
    res.status(404).json({
      error: err.message
    })
  }
}

// update user data
exports.updateUser = async (req, res) => {
  try {
    const { username, name, email, desc, gender, _id } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { username, name, email, desc, gender },
      {
        new: true
      }
    )

    const { password, createdAt, updatedAt, post, ...rest } = updatedUser._doc

    res.status(200).json(rest)
  } catch (err) {
    debug(err)
    res.status(404).json({
      error: err.message
    })
  }
}

// update user profile picture
exports.updateProfilePic = async (req, res) => {
  try {
    const { image, id, publicId } = req.body

    if (!image || !id) {
      return res.status(400).json({ error: 'data not complete' })
    }

    // remove old pic in cloudinary
    if (publicId && publicId !== 'new') {
      await cloudinary.uploader.destroy(publicId)
    }

    // upload to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      upload_preset: process.env.CLOUDINARY_UPLOAD_PIC
    })

    await User.findByIdAndUpdate(id, {
      img_thumb: uploadResponse.secure_url,
      img_thumb_id: uploadResponse.public_id
    })

    res.json({
      message: 'Update success',
      img_thumb: uploadResponse.secure_url
    })
  } catch (err) {
    debug(err)
    res.status(404).json({
      error: err.message
    })
  }
}

// remove user by id
exports.removeUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return res.status(404).json({
        error: 'user not found'
      })
    }

    // remove user's post -> remove post image when remove post

    res.json({
      message: `user with id=${user._id} and username=${user.username} has been deleted`
    })
  } catch (err) {
    debug({ err })
    res.status(404).json({
      error: err.message
    })
  }
}

exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { populate } = req.query

    const populates = []

    if (populate) {
      const populateOptions = ['post', 'savedPost', 'roles']
      // populate=post,savedPost,roles
      const opt = populate.split(',')

      populateOptions.forEach((val) => {
        if (opt.includes(val)) {
          populates.push(val)
        }
      })
    }

    const user = await User.findById(userId).populate(populates)
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ error: 'user not found' })
    }
    // send except password
    const { password, __v, createdAt, updatedAt, ...rest } = user._doc

    return res.json({ ...rest })
  } catch (err) {
    debug({ err })
    res.status(404).json({
      error: err.message
    })
  }
}

// follower and following

exports.follow = async (req, res) => {
  try {
    // selanjutnya, userId akan diganti dengan id user yang sedang login
    const { followId, userId } = req.body
    if (userId === followId) {
      return res.status(442).json({
        error: 'Tidak boleh follow diri sendiri!'
      })
    }

    // cek apakah userid atau followid ada dalam database
    const user = await User.findById(userId)
    const followUser = await User.findById(followId)
    if (user === null) {
      return res.status(442).json({
        error: 'Kamu siapa?'
      })
    } else if (followUser === null) {
      return res.status(442).json({
        error: 'Kamu mau mengikuti siapa?'
      })
    }

    // cek apakah sudah mengikuti
    const existFollowers = followUser.followers.includes(userId)
    if (existFollowers) {
      return res.status(442).json({
        error: 'Sudah mengikuti'
      })
    }

    // lakukan follow dan following
    await User.findByIdAndUpdate(
      followId,
      {
        // pake addToSet biar id yang sama tidak masuk
        $addToSet: {
          followers: userId
        }
      },
      {
        new: true
      }
    )
    await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          following: followId
        }
      },
      {
        new: true
      }
    )
    res.json({
      message: 'Yeay! berhasil!'
    })
  } catch (error) {
    debug({ error })

    res.status(404).json({
      error: 'Yahh, gagal!'
    })
  }
}

// unfollow

exports.unFollow = async (req, res) => {
  try {
    // selanjutnya, userId akan diganti dengan id user yang sedang login
    const { unfollowId, userId } = req.body
    if (unfollowId === userId) {
      return res.status(442).json({
        error: 'Tidak boleh sama'
      })
    }

    // cek apakah userid atau followid ada dalam database
    const poorPerson = await User.findById(userId)
    const famousPerson = await User.findById(unfollowId)
    if (poorPerson === null) {
      return res.status(442).json({
        error: 'Kamu siapa?'
      })
    } else if (famousPerson === null) {
      return res.status(422).json({
        error: 'Siapa yang mau kamu unfollow?'
      })
    }

    // cek apakah belum mengikuti
    const existFollower = famousPerson.followers.includes(userId)
    if (!existFollower) {
      return res.status(442).json({
        error: 'Kamu belum mengikuti'
      })
    }

    // lakukan unfollow
    await User.findByIdAndUpdate(
      unfollowId,
      {
        $pull: {
          followers: userId
        }
      },
      {
        new: true
      }
    )
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          following: unfollowId
        }
      },
      {
        new: true
      }
    )

    res.json({
      message: 'Success unfollow'
    })
  } catch (error) {
    debug({ error })
    res.status(404).json({
      error: 'Fail unfollow'
    })
  }
}

exports.followStatus = async (req, res) => {
  try {
    const user = await User.find({}, '_id username followers following').populate('followers following', 'username')
    res.json(user)
  } catch (error) {
    debug({ error })
    res.status(404).json({
      error: error.message
    })
  }
}
