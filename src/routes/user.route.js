const router = require('express').Router()
const { userController } = require('../controllers')
const { authJwt } = require('../middleware')

router.route('/:userId').get(userController.getUser).put(authJwt.verifyToken, userController.updateUser)

router.put('/update/image', authJwt.verifyToken, userController.updateProfilePic)

router.route('/').get(userController.getUsers)

module.exports = router
