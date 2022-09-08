'use strict'

const router = require('express').Router()
const authRoute = require('./auth.route')
const commentRoute = require('./comment.route')
const postRoute = require('./post.route')
const userRoute = require('./user.route')
const docsRoute = require('./docs.route')
const config = require('../../config/config')

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute
    },
    {
        path: '/comment',
        route: commentRoute
    },
    {
        path: '/post',
        route: postRoute
    },
    {
        path: '/user',
        route: userRoute
    }
]

const devRoutes = [
    // routes available only in development mode
    {
        path: '/docs',
        route: docsRoute
    }
]

/* istanbul ignore next */
if (config.env === 'development') {
    devRoutes.forEach((route) => {
        router.use(route.path, route.route)
    })
}

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

module.exports = router
