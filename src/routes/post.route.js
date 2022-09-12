const router = require('express').Router()
const { postController } = require('../controllers')
const { authJwt } = require('../middleware')

router.route('/').get(postController.getPosts).post(authJwt.verifyToken, postController.createNewPost)

router.route('/:postId').get(postController.getPost).delete(authJwt.verifyToken, postController.deletePost)

router.route('/like').put(authJwt.verifyToken, postController.togglePostLike)

router.route('/save').put(authJwt.verifyToken, postController.toggleUserSavedPost)


module.exports = router
