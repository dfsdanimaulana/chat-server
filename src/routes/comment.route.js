const router = require('express').Router()

// Controllers
const { commentController } = require('../controllers')
const { commentValidation } = require('../validations')

// Middleware
const { authJwt, validate } = require('../middleware')

router.route('/').get(commentController.getComments).post(authJwt.verifyToken, commentController.createComment)

router
  .route('/:commentId')
  .get(authJwt.verifyToken, commentController.getComment)
  .post(authJwt.verifyToken, validate(commentValidation.toggleLikeComment), commentController.toggleLikeComment)
  .delete(authJwt.verifyToken, commentController.deleteComment)

module.exports = router
