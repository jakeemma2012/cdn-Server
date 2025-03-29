const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/videos');
    },
    filename: function (req, file, cb) {
        const filePath = path.join('uploads/videos', file.originalname);
        if (fs.existsSync(filePath)) {
            return cb(new Error('File already exists'));
        }
        cb(null, file.originalname);
    }
});

const storage_image = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/images');
    },
    filename: function (req, file, cb) {
        const filePath = path.join('uploads/images', file.originalname);
        if (fs.existsSync(filePath)) {
            return cb(new Error('File already exists'));
        }
        cb(null, file.originalname);
    }
});

const upload_video = multer({ 
    storage: storage, 
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, true);
    }
}); 

const upload_image = multer({ 
    storage: storage_image, 
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, true); 
    }
});

const handleMulterError = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message 
        });
    }
    next();
};

module.exports = { upload_video, upload_image, handleMulterError };