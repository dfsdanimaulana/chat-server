'use strict'

const router = require('express').Router()

// post controller
const {
    getPost,
    addPost,
    updatePostCaption,
    removePost,
    getUserPostById
} = require('../controllers/post.controllers')

// Middleware
const { isAuth } = require('../middleware/isAuth')

// delete post
router.get('/del/:id', isAuth, removePost)

// get all user posts by userid
router.get('/:userId', getUserPostById)

// get post
router.get('/', getPost)

// Add post
router.post('/', addPost)
// // Add post
// router.post('/', isAuth, addPost)

// update post
router.put('/', isAuth, updatePostCaption)

module.exports = router
