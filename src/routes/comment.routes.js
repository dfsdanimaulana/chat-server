'use strict'

const router = require('express').Router()

// Controllers
const {
    addComment,
    likeComment,
    unlikeComment,
    getCommentByPostId,
    getComments
} = require('../controllers/comment.controllers')

// Middleware
const { verifyToken } = require('../middleware/verifyToken')

// get comment by post id
router.get('/:id', getCommentByPostId)

router.get('/', getComments)

// add comment
router.post('/', verifyToken, addComment)

// like comment
router.put('/like', verifyToken, likeComment)

// unlike comment
router.put('/unlike', verifyToken, unlikeComment)

module.exports = router
