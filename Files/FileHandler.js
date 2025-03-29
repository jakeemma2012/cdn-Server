const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uploadDir = 'uploads/';
        const filePath = path.join(uploadDir, file.originalname);
        if (fs.existsSync(filePath)) {
            cb(new Error('File already exists'));
        } else {
            cb(null, file.originalname);
        }
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 500 * 1024 * 1024 } }); 

module.exports = upload;