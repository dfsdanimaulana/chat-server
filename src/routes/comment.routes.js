'use strict'

const router = require('express').Router()

// Controllers
const {
    addComment,
    likeComment,
    unlikeComment,
    getCommentByPostId,
    getComments,
    deleteCommentById
} = require('../controllers/comment.controllers')

// Middleware
const { verifyToken } = require('../middleware/verifyToken')

/* ============================ GET METHODS ============================ */

// get comment by post id
router.get('/:id', getCommentByPostId)

// get all post comments
router.get('/', getComments)

/* ============================ POST METHODS ============================ */

// add new comment
router.post('/', verifyToken, addComment)

/* ============================ PUT METHODS ============================ */

// like comment
router.put('/like', verifyToken, likeComment)
// unlike comment
router.put('/unlike', verifyToken, unlikeComment)

/* ============================ DELETE METHODS ============================ */
router.delete('/:id', verifyToken, deleteCommentById)

module.exports = router
