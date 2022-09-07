'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { isEmail, isAlphanumeric } = require('validator')

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, 'username is required'],
            unique: [true, 'user is already use'],
            minlength: [4, 'username must be more than 4 character'],
            maxlength: [15, 'username must be less than 15 character'],
            lowercase: true,
            validate: [
                isAlphanumeric,
                'username must not have any special character'
            ]
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: [true, 'email address is already use'],
            required: [true, 'email address is required'],
            validate: [isEmail, 'please fill a valid email address']
        },
        password: {
            type: String,
            required: [true, 'password is required'],
            minlength: [6, 'password must be 6 character or more']
        },
        roles: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Role'
            }
        ],
        name: {
            type: String,
            default: ''
        },
        img_thumb: {
            type: String,
            default: 'https://i.ibb.co/jkKCvyd/male-avatar.png'
        },
        img_thumb_id: {
            type: String,
            default: 'new'
        },
        img_bg: {
            type: String,
            default: 'https://source.unsplash.com/random/400x200'
        },

        gender: {
            type: String,
            default: 'male'
        },
        desc: {
            type: String,
            default: ''
        },
        followers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        following: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        post: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Post'
            }
        ],
        savedPost: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Post'
            }
        ],
        age: {
            type: Number
        },
        birthday: {
            type: Date
        }
    },
    {
        timestamps: true
    }
)

const User = mongoose.model('User', userSchema)

module.exports = User
