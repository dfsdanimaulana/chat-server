const Joi = require('joi')

const toggleLikeComment = {
  body: Joi.object().keys({
    userId: Joi.string().required()
  }),
  params: Joi.object().keys({
    commentId: Joi.string().required()
  })
}

module.exports = { toggleLikeComment }
