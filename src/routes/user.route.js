const router = require('express').Router()
const { userController } = require('../controllers')
const { authJwt } = require('../middleware')

router.route('/').get(userController.getUsers)

router.route('/:userId').get(userController.getUser).put(authJwt.verifyToken, userController.updateUser)

router.put('/update/image', authJwt.verifyToken, userController.updateProfilePic)

module.exports = router
