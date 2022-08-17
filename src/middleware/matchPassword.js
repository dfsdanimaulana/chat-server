'use strict'

const User = require('../models/user.models')
const { compare } = require('bcryptjs')

exports.matchPassword = async (req, res, next) => {
    
    const {userId, password} = req.body
    
    try {
        const user = await User.findById(userId)
        const isMatch = await compare(password, user.password)
        if(isMatch) {
            next()
        } else {
            res.status(442).json({message:'incorrect password'})
        }
    } catch (error) {
        res.status(400).json({message: 'match password error', error})
    }
}