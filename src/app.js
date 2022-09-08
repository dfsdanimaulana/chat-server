'use strict'

const express = require('express')
const helmet = require('helmet')
const compression = require('compression')
const xss = require('xss-clean')
const mongoSanitize = require('express-mongo-sanitize')
const passport = require('passport')
const httpStatus = require('http-status')
const createError = require('http-errors')
const config = require('./config/config')
const morgan = require('./config/morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const routes = require('./routes/v1')
const { jwtStrategy } = require('./config/passport')
const { authLimiter } = require('./middlewares/rateLimiter')
const { errorConverter, errorHandler } = require('./middlewares/error')
const ApiError = require('./utils/ApiError')

const app = express()

if (config.env !== 'test') {
    app.use(morgan.successHandler)
    app.use(morgan.errorHandler)
}

// set security HTTP headers
app.use(helmet())

// accept json
app.use(express.json({ limit: '50mb' }))

// parse urlencoded request body
app.use(
    express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
)

// sanitize request data
app.use(xss())
app.use(mongoSanitize())

// gzip compression
app.use(compression())

// cors security
app.use(
    cors({
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    })
)

app.options('*', cors())

// jwt authentication
app.use(passport.initialize())
passport.use('jwt', jwtStrategy)

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
    app.use('/v1/auth', authLimiter)
}

app.use(cookieParser())

// v1 api routes
app.use('/v1', routes)

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
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

// convert error to ApiError, if needed
app.use(errorConverter)

// handle error
app.use(errorHandler)

module.exports = app
