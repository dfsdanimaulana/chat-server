'use strict'

const dotenv = require('dotenv')
const path = require('path')
const Joi = require('joi')

dotenv.config({ path: path.join(__dirname, '../../.env') })

const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string()
            .valid('production', 'development', 'test')
            .required(),
        PORT: Joi.number().default(3000),
        DB_ATLAS_DEV: Joi.string()
            .required()
            .description('Mongo DB Atlas url for development'),
        DB_ATLAS_PROD: Joi.string()
            .required()
            .description('Mongo DB Atlas url for production'),
        JWT_TOKEN_SECRET: Joi.string().required().description('JWT secret key'),
        JWT_REFRESH_TOKEN_SECRET: Joi.string()
            .required()
            .description('JWT refresh token secret key'),
        JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
            .default(30)
            .description('minutes after which access tokens expire'),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
            .default(30)
            .description('days after which refresh tokens expire'),
        CLOUDINARY_URL: Joi.string().required().description('cloudinary url'),
        CLOUDINARY_API_SECRET: Joi.string()
            .required()
            .description('cloudinary api secret'),
        CLOUDINARY_API_KEY: Joi.number()
            .required()
            .description('cloudinary api url'),
        CLOUDINARY_NAME: Joi.string().required().description('cloudinary name'),
        CLOUDINARY_UPLOAD_POST: Joi.string()
            .required()
            .description(
                'cloudinary upload preset / folder to upload posts user'
            ),
        CLOUDINARY_UPLOAD_PIC: Joi.string()
            .required()
            .description(
                'cloudinary upload preset / folder to upload profile image user'
            )
    })
    .unknown()

const { value: envVars, error } = envVarsSchema
    .prefs({ errors: { label: 'key' } })
    .validate(process.env)

if (error) {
    throw new Error(`Config validation error: ${error.message}`)
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongoose: {
        url:
            envVars.NODE_ENV === 'development'
                ? envVars.DB_ATLAS_DEV
                : envVars.DB_ATLAS_PROD,
        options: {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },
    jwt: {
        secret: envVars.JWT_TOKEN_SECRET,
        refresh_secret: envVars.JWT_REFRESH_TOKEN_SECRET,
        accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS
    },
    cloudinary: {
        url: envVars.CLOUDINARY_URL,
        api_secret: envVars.CLOUDINARY_API_SECRET,
        api_key: envVars.CLOUDINARY_API_KEY,
        name: envVars.CLOUDINARY_NAME,
        upload_post: envVars.CLOUDINARY_UPLOAD_POST,
        upload_pic: envVars.CLOUDINARY_UPLOAD_PIC
    }
}
