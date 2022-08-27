'use strict'

const jwt = require('jsonwebtoken')

// verify token middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    if (token === 'null') {
        return res.status(401).json({ message: 'Token is null' })
    }

    jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
        if (err)
            return res.status(403).json({
                error: 'Token is not valid!',
            })
        req.user = decoded // payload contain id and username
        next()
    })
}
module.exports = { verifyToken }
