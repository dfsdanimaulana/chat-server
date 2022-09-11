'use strict'

const jwt = require('jsonwebtoken')
const debug = require('debug')('dev')
const db = require('../models')
const User = db.user
const Role = db.role

// verify token middleware
exports.verifyToken = (req, res, next) => {
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
        error: 'Token is not valid!'
      })
    req.userId = decoded._id // payload contain id and username
    next()
  })
}

exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)

    const roles = await Role.find({
      _id: { $in: user.roles }
    })

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === 'admin') {
        next()
        return
      }
    }
    res.status(403).json({ message: 'Require Admin Role!' })
  } catch (err) {
    debug({ err })
    res.status(500).json({ error: err.message })
  }
}
exports.isModerator = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)

    const roles = await Role.find({
      _id: { $in: user.roles }
    })

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === 'moderator') {
        next()
        return
      }
    }
    res.status(403).json({ message: 'Require Moderator Role!' })
  } catch (err) {
    debug({ err })
    res.status(500).json({ error: err.message })
  }
}
