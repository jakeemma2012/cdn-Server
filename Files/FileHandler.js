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
        } else if (file.fieldname === 'chunk') {
            // Parse thông tin từ tên file gốc
            const fileInfo = file.originalname.split('|');
            const fileType = fileInfo[0];
            const fileName = sanitizeFilename(fileInfo[1]).replace(/\s+/g, '_');
            const chunkIndex = fileInfo[2];

            if (!fileType || !fileName) {
                return cb(new Error('Invalid file information'));
            }

            // Tạo cấu trúc thư mục cho chunks
            const chunksRootDir = path.join('uploads', 'chunks');
            if (!fs.existsSync(chunksRootDir)) {
                fs.mkdirSync(chunksRootDir, { recursive: true });
            }

            const fileTypeDir = path.join(chunksRootDir, fileType);
            if (!fs.existsSync(fileTypeDir)) {
                fs.mkdirSync(fileTypeDir, { recursive: true });
            }

            const chunkDir = path.join(fileTypeDir, fileName);
            if (!fs.existsSync(chunkDir)) {
                fs.mkdirSync(chunkDir, { recursive: true });
            }

            cb(null, chunkDir);
        } else if (file.fieldname === 'cast') {
            const movieName = req.body.movieName || 'unknown';
            const castDir = path.join('uploads', 'casts', movieName);

            if (!fs.existsSync(castDir)) {
                fs.mkdirSync(castDir, { recursive: true });
            }
            cb(null, castDir);
        } else {
            cb(new Error('Invalid field name'));
        }
    },

    filename: function (req, file, cb) {
        if (file.fieldname === 'chunk') {
            // Parse chunkIndex từ tên file gốc
            const fileInfo = file.originalname.split('|');
            const chunkIndex = fileInfo[2];
            cb(null, `chunk_${chunkIndex}`);
        } else if (file.fieldname === 'cast') {
            const castName = sanitizeFilename(file.originalname);
            cb(null, `${Date.now()}_${castName}`);
        } else {
            const sanitizedName = sanitizeFilename(file.originalname);
            file.originalname = Date.now() + '_' + sanitizedName;
            cb(null, file.originalname);
        }
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
    limits: {
        fileSize: 5000 * 1024 * 1024 // 5GB
    },
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
        } else if (file.fieldname === 'chunk') {
            const fileInfo = file.originalname.split('|');
            if (fileInfo.length !== 3) {
                return cb(new Error('Invalid chunk file format'));
            }
            cb(null, true);
        } else if (file.fieldname === 'cast') {
            cb(null, true);
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

module.exports = {
    upload,
    handleMulterError,
    compressMiddleWare,
};