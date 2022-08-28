'use strict'

const router = require('express').Router()

const {
    getUsers,
    removeUser,
    getUserWithPost,
    getUserById,
    follow,
    unFollow,
    followStatus,
    updateUser,
} = require('../controllers/user.controllers')

const { verifyToken } = require('../middleware/verifyToken')

/** GET METHOD */

// get user with post
router.get('/post', getUserWithPost)

// follow status
router.get('/follow-status', followStatus)

// delete user
router.get('/del/:id', verifyToken, removeUser)

// get user by id
router.get('/:id', getUserById)

// get user
router.get('/', getUsers)

/**  PUT METHOD */

// follow
router.put('/follow', verifyToken, follow)

// unfollow
router.put('/unfollow', verifyToken, unFollow)

// update user
router.put('/update', verifyToken, updateUser)
/** POST METHOD */

module.exports = router
