'use strict'

const express = require('express')
const createError = require('http-errors')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const db = require('./models')
const Role = db.role
const chalk = require('chalk')
require('dotenv').config()

const app = express()

// cors security
app.use(
    cors({
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    })
)

app.use(express.json({ limit: '50mb' }))
app.use(
    express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
)

app.use(cookieParser())

// Routes
app.use('/auth', require('./routes/auth.routes'))
app.use('/user', require('./routes/user.routes'))
app.use('/post', require('./routes/post.routes'))
app.use('/comment', require('./routes/comment.routes'))

app.use('/', (req, res) => {
    res.json({
        message: 'Welcome to DanApp server'
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
        message: 'Page Not Found'
    })
})

// connect to db
db.mongoose
    .connect(process.env.DB_ATLAS, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log(chalk.blue('Database Connected'))
        initial()
    })
    .catch((err) => {
        console.error('DB Connection Error', err)
        process.exit()
    })

// initial() function helps us to create 3 important rows in roles collection.

function initial() {
    Role.estimatedDocumentCount((err, count) => {
        if (!err && count === 0) {
            new Role({
                name: 'user'
            }).save((err) => {
                if (err) {
                    console.log('Role error', err)
                }
                console.log("added 'user' to roles collection")
            })
            new Role({
                name: 'moderator'
            }).save((err) => {
                if (err) {
                    console.log('Role error', err)
                }
                console.log("added 'moderator' to roles collection")
            })
            new Role({
                name: 'admin'
            }).save((err) => {
                if (err) {
                    console.log('Role error', err)
                }
                console.log("added 'admin' to roles collection")
            })
        }
    })
}

module.exports = app
