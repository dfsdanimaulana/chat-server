'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roleSchema = new Schema({
  name: String
})

const Role = mongoose.model('Role', roleSchema)

module.exports = Role
