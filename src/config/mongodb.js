'use strict'

const mongoose = require('mongoose')
const config = require('./config')

mongoose.connect(config.mongoose.url, config.mongoose.options)

mongoose.set('returnOriginal', false)

module.exports = mongoose
