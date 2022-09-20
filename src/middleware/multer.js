const multer = require('multer')

const storage = multer.memoryStorage()

const upload = (param) =>
  multer({
    storage
  }).single(param)

const uploads = (param, max) =>
  multer({
    storage
  }).array(param, max)

module.exports = { upload, uploads }
