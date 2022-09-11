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
    updateProfilePic
} = require('../controllers/user.controller')

// middleware
const { authJwt } = require('../middleware')
const { verifyToken } = authJwt

/* ============================ GET METHODS ============================ */

// get user with post
router.get('/post', getUserWithPost)

// follow status
router.get('/follow-status', followStatus)

// delete user
router.get('/del/:id', [verifyToken], removeUser)

// get user by id
router.get('/:id', getUserById)

// get user
router.get('/', getUsers)

/* ============================ POST METHODS ============================ */

/* ============================ PUT METHODS ============================ */

// follow user
router.put('/follow', [verifyToken], follow)

// unfollow user
router.put('/unfollow', [verifyToken], unFollow)

// update user image profile
router.put('/update/image', [verifyToken], updateProfilePic)

// update user
router.put('/update', [verifyToken], updateUser)

/* ============================ DELETE METHODS ============================ */

module.exports = router
