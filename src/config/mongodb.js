'use strict'

const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.DB_ATLAS, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

mongoose.set('returnOriginal', false)

module.exports = mongoose
