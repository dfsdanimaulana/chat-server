const express = require('express')

const authRoute = require('./auth.route')
const commentRoute = require('./comment.route')
const postRoute = require('./post.route')
const userRoute = require('./user.route')

const router = express.Router()

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/user',
    route: userRoute
  },
  {
    path: '/post',
    route: postRoute
  },
  {
    path: '/comment',
    route: commentRoute
  }
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

module.exports = router
