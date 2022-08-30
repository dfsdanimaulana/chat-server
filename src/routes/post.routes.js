'use strict'

const router = require('express').Router()

// post controller
const {
    getPost,
    addPost,
    updatePostCaption,
    deletePost,
    getUserPostById,
} = require('../controllers/post.controllers')

// Middleware
const { verifyToken } = require('../middleware/verifyToken')

// delete post
router.delete('/:id', verifyToken, deletePost)

// get all user posts by userId
router.get('/:userId', getUserPostById)

// get post
router.get('/', getPost)

// Add post
router.post('/', verifyToken, addPost)

// update post
router.put('/', verifyToken, updatePostCaption)

module.exports = router
