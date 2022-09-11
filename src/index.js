const http = require('http')
const chalk = require('chalk')
require('dotenv').config()
const app = require('./app')
const db = require('./models')
const Role = db.role

const port = normalizePort(process.env.PORT || '3000')
const server = http.createServer(app)

// connect to db
db.mongoose
    .connect(process.env.DB_ATLAS_DEV, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log(chalk.red('Database Connected'))
        server.listen(port)
        initial()
    })
    .catch((err) => {
        console.error('DB Connection Error', err)
        process.exit()
    })

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

server.on('error', onError)
server.on('listening', onListening)

function normalizePort(val) {
    const port = parseInt(val, 10)

    if (isNaN(port)) {
        // named pipe
        return val
    }

    if (port >= 0) {
        // port number
        return port
    }

    return false
}

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error
    }

    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges')
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(bind + ' is already in use')
            process.exit(1)
            break
        default:
            throw error
    }
}

function onListening() {
    const addr = server.address()
    const bind =
        typeof addr === 'string'
            ? 'pipe ' + addr
            : chalk.blue(`http://localhost:${addr.port}`)
    console.log(chalk.red.italic(`server running on ${bind}`))
}
