const router = require('express').Router()

// Controllers
const { commentController } = require('../controllers')

// Middleware
const { authJwt } = require('../middleware')

router
  .route('/:commentId')
  .get(authJwt.verifyToken, commentController.getComment)
  .delete(authJwt.verifyToken, commentController.deleteComment)

router.route('/').get(commentController.getComments).post(authJwt.verifyToken, commentController.createComment)

module.exports = router
