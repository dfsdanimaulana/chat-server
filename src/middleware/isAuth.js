'use strict'

const jwt = require('jsonwebtoken')

const isAuth = (req, res, next) => {
    const token = req.cookies.jwt

    if (!token)
        return res.status(401).json({
            isLoggedIn: false,
        })

    jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
        if (err)
            return res.status(401).json({
                isLoggedIn: false,
            })
        req.user = decoded.id
        next()
    })
}

module.exports = { isAuth }