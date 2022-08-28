'use strict'

const express = require('express')
const createError = require('http-errors')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('./src/config/mongodb')
const chalk = require('chalk')
require('dotenv').config()

const app = express()

// cors security
app.use(
    cors({
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    })
)

app.use(express.json({ limit: '50mb' }))
app.use(
    express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
)

app.use(cookieParser())

// Routes
app.use('/auth', require('./src/routes/auth.routes'))
app.use('/user', require('./src/routes/user.routes'))
app.use('/post', require('./src/routes/post.routes'))
app.use('/comment', require('./src/routes/comment.routes'))

app.use('/', (req, res) => {
    res.json({
        message: 'Welcome to DanApp server',
    })
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404))
})

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.json({
        message: 'Page Not Found',
    })
})

// connect to db

mongoose.connection
    .on(
        'error',
        console.error.bind(console, new Error('Database Connection Error!'))
    )
    .once('open', () => {
        console.log(
            chalk.red.italic(`    
          💾 Database connected!
        `)
        )
    })

module.exports = app
