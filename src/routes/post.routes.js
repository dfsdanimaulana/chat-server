'use strict'

const router = require('express').Router()

// post controller
const {
    getPost,
    createNewPost,
    updatePostCaption,
    deletePost,
    getUserPostById,
    togglePostLike,
} = require('../controllers/post.controllers')

// Middleware
const { verifyToken } = require('../middleware/verifyToken')

// delete post
router.delete('/:id', verifyToken, deletePost)

// get all user posts by userId
router.get('/:userId', getUserPostById)

// get post
router.get('/', getPost)

// toggle like and unlike post
router.post('/like', verifyToken, togglePostLike)

// Add post
router.post('/', verifyToken, createNewPost)

// update post
router.put('/', verifyToken, updatePostCaption)

module.exports = router
