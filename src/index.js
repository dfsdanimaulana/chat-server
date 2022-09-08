'use strict'

const app = require('./app')
const config = require('./config/config')
const logger = require('./config/logger')
const db = require('./models')
const Role = db.role

let server

// connect to mongodb
db.mongoose.connection.once('open', () => {
    server = app.listen(config.port, () => {
        logger.info(`Listening to port ${config.port}`)
    })
    initial()
})

// initial() function helps us to create 3 important rows in roles collection.

function initial() {
    Role.estimatedDocumentCount((err, count) => {
        if (!err && count === 0) {
            new Role({
                name: 'user'
            }).save((err) => {
                if (err) {
                    logger.error('Role error', err)
                }
                logger.info("added 'user' to roles collection")
            })
            new Role({
                name: 'moderator'
            }).save((err) => {
                if (err) {
                    logger.error('Role error', err)
                }
                logger.info("added 'moderator' to roles collection")
            })
            new Role({
                name: 'admin'
            }).save((err) => {
                if (err) {
                    logger.error('Role error', err)
                }
                logger.info("added 'admin' to roles collection")
            })
        }
    })
}

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed')
            process.exit(1)
        })
    } else {
        process.exit(1)
    }
}

const unexpectedErrorHandler = (error) => {
    logger.error(error)
    exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', () => {
    logger.info('SIGTERM received')
    if (server) {
        server.close()
    }
})
