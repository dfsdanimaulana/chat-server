'use strict'

const router = require('express').Router()

const {
    getUsers,
    updateUserData,
    removeUser,
    getUserWithPost,
    getUserById,
    follow,
    unFollow,
    followStatus,
} = require('../controllers/user.controllers')

const { isAuth } = require('../middleware/isAuth')

/** GET METHOD */

// get user with post
router.get('/post', getUserWithPost)

// follow status
router.get('/follow-status', followStatus)

// delete user
router.get('/del/:id', isAuth, removeUser)

// get user by id
router.get('/:id', getUserById)

// get user
router.get('/', getUsers)

/**  PUT METHOD */

// follow
router.put('/follow', isAuth, follow)

// unfollow
router.put('/unfollow', isAuth, unFollow)

// update user
router.put('/update', isAuth, updateUserData)

/** POST METHOD */

module.exports = router
