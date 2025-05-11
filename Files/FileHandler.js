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
            // Lấy thông tin từ fieldname của file, sử dụng dấu |
            const fileInfo = file.originalname.split('|');
            // Lấy 3 phần tử cuối cùng
            const chunkIndex = fileInfo.pop() || '0';
            const fileName = fileInfo.pop() || 'unknown';
            const fileType = fileInfo.join('|') || 'temp'; // Join lại các phần còn lại

            console.log('File info:', { fileType, fileName, chunkIndex });

            // Tạo thư mục gốc cho chunks
            const chunksRootDir = path.join('uploads', 'chunks');
            if (!fs.existsSync(chunksRootDir)) {
                fs.mkdirSync(chunksRootDir, { recursive: true });
            }

            // Tạo thư mục cho loại file
            const fileTypeDir = path.join(chunksRootDir, fileType);
            if (!fs.existsSync(fileTypeDir)) {
                fs.mkdirSync(fileTypeDir, { recursive: true });
            }

            // Tạo thư mục cho file cụ thể
            const chunkDir = path.join(fileTypeDir, fileName);
            if (!fs.existsSync(chunkDir)) {
                fs.mkdirSync(chunkDir, { recursive: true });
            }

            cb(null, chunkDir);
        } else {
            cb(new Error('Invalid field name'));
        }
    },

    filename: function (req, file, cb) {
        if (file.fieldname === 'chunk') {
            // Lấy chunkIndex từ originalname, sử dụng dấu |
            const fileInfo = file.originalname.split('|');
            const chunkIndex = fileInfo.pop() || '0';
            cb(null, `chunk_${chunkIndex}`);
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

// Export cả middleware parseFormData
module.exports = {
    upload,
    handleMulterError,
    compressMiddleWare,
};