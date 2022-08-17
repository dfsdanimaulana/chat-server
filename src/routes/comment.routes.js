'use strict'

const router = require('express').Router()

// Controllers
const { addComment, likeComment, unlikeComment, getCommentByPostId } = require('../controllers/comment.controllers')

// Middleware
const {
    isAuth
} = require('../middleware/isAuth')

// get comment by post id
router.get('/:id', isAuth, getCommentByPostId)

// add comment
router.post('/', isAuth, addComment )

// like comment
router.put('/like', isAuth, likeComment )

// unlike comment
router.put('/unlike', isAuth, unlikeComment )

module.exports = router