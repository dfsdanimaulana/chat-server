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
    toggleUserSavedPost,
    getPostById
} = require('../controllers/post.controllers')

// Middleware
const { verifyToken } = require('../middleware/verifyToken')

/* ============================ GET METHODS ============================ */
// get post by id
router.get('/:id', getPostById)

// get all user posts by userId
router.get('/user/:userId', getUserPostById)

// get post
router.get('/', getPost)

/* ============================ POST METHODS ============================ */

// Add post
router.post('/', verifyToken, createNewPost)

/* ============================ PUT METHODS ============================ */

// toggle like and unlike post
router.put('/like', verifyToken, togglePostLike)

// toggle save and unsave selected post
router.put('/save', verifyToken, toggleUserSavedPost)

// update post
router.put('/', verifyToken, updatePostCaption)

/* ============================ DELETE METHODS ============================ */

// delete post
router.delete('/:id', verifyToken, deletePost)

module.exports = router
