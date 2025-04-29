const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { sanitizeFilename } = require('../Utils/process');
const { exec } = require('child_process');
const compressVideoBackground = require('../Services/CompressService');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'image') {
            cb(null, 'uploads/images');
        } else if (file.fieldname === 'video') {
            cb(null, 'uploads/videos');
        } else if (file.fieldname === 'backdrop') {
            cb(null, 'uploads/backdrops');
        }
    },

    filename: function (req, file, cb) {
        const sanitizedName = sanitizeFilename(file.originalname);
        file.originalname = sanitizedName;
        let uploadPath;
        if (file.fieldname === 'image') {
            uploadPath = path.join('uploads/images', file.originalname);
        } else if (file.fieldname === 'video') {
            uploadPath = path.join('uploads/videos', file.originalname);

        } else if (file.fieldname === 'backdrop') {
            uploadPath = path.join('uploads/backdrops', file.originalname);
        }

        if (fs.existsSync(uploadPath)) {
            return cb(new Error(`File ${file.originalname} already exists in ${file.fieldname} directory`));
        }

        cb(null, file.originalname);

    }
});

const compressMiddleWare = async (req, res, next) => {
    try {
        if (req.files && req.files.video) {
            const videoFile = Array.isArray(req.files.video) ? req.files.video[0] : req.files.video;

            const videoPath = videoFile.path;
            const folderName = req.body.name || sanitizeFilename(req.query.name) || 'DefaultName';

            console.log('Compressing video:', videoPath, 'to folder:', folderName);

            compressVideoBackground(videoPath, folderName);
        }
        next();
    } catch (err) {
        console.error('Error during compressing video:', err);
        res.status(500).json({ success: false, message: 'Video processing failed.' });
    }
};



const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'image') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'));
            }
        } else if (file.fieldname === 'video') {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only video files are allowed!'));
            }
        } else if (file.fieldname === 'backdrop') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'));
            }
        } else {
            cb(new Error('Invalid field name'));
        }
    }
});

const handleMulterError = (err, req, res, next) => {
    if (err) {
        console.log(err);
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = { upload, handleMulterError, compressMiddleWare };