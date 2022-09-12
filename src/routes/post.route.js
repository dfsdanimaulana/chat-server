const router = require('express').Router()
const { postController } = require('../controllers')
const { authJwt } = require('../middleware')

router.route('/').get(postController.getPost).post(authJwt.verifyToken, postController.createNewPost)

router.route('/:postId').get(postController.getPostById).delete(authJwt.verifyToken, postController.deletePost)

// get all user posts by userId
router.get('/user/:userId', postController.getUserPostById)

router.route('/like').put(authJwt.verifyToken, postController.togglePostLike)

router.route('/save').put(authJwt.verifyToken, postController.toggleUserSavedPost)

module.exports = router
