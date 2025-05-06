const multer = require('multer');
const encrypt = require('../encryption/encrypt');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', '..', 'public', 'images', 'profile');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const name = encrypt.generateToken();
        cb(null, name + extension);
    }
});

const upload = multer({ storage: storage });

module.exports = { upload };