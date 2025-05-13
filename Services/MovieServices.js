const express = require("express");
const router = express.Router();
const { db } = require("../Database/database");
const jwt = require("jsonwebtoken");
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const Movie = require("../Models/Movie");
const BASE_URL = process.env.BASE_URL;
const { upload, handleMulterError, compressMiddleWare } = require("../Files/FileHandler");
const path = require("path");
const fs = require("fs");
const movie_cast = require("../Models/MovieCast");
const LinkVideos = require("../Models/LinkVideos");
const LinkImages = require("../Models/LinkImages");
const { sanitizeFilename } = require("../Utils/process");
const LinkBackDrop = require("../Models/LinkBackDrop");
const { exec } = require('child_process');
const { dir, log } = require("console");
const axios = require('axios');
const FormData = require('form-data');
const compressVideoBackground = require('../Services/CompressService');
// Constants
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
const MAX_BACKDROP_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RETRIES = 3;

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    const role = decoded.role;
    if (role !== "ADMIN")
      return res.status(401).json({ message: "Unauthorized" });
    next();
  });
};

// Helper functions
const validateFiles = (image, video, backdrop) => {
  const errors = [];

  if (!image || !image.name) errors.push('Image file is required');
  if (!video || !video.name) errors.push('Video file is required');
  if (!backdrop || !backdrop.name) errors.push('Backdrop file is required');

  if (image && !image.type.startsWith('image/')) errors.push('Invalid image file type');
  if (video && !video.type.startsWith('video/')) errors.push('Invalid video file type');
  if (backdrop && !backdrop.type.startsWith('image/')) errors.push('Invalid backdrop file type');

  if (image && image.size > MAX_IMAGE_SIZE) errors.push('Image file size exceeds limit');
  if (video && video.size > MAX_VIDEO_SIZE) errors.push('Video file size exceeds limit');
  if (backdrop && backdrop.size > MAX_IMAGE_SIZE) errors.push('Backdrop file size exceeds limit');

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
};

const uploadChunk = async (chunk, chunkIndex, totalChunks, fileName, fileType) => {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', totalChunks);
  formData.append('fileName', fileName);
  formData.append('fileType', fileType);

  let retryCount = 0;
  while (retryCount < MAX_RETRIES) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/chunk`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Content-Type': 'multipart/form-data'
          },
          timeout: UPLOAD_TIMEOUT
        }
      );
      return response.data;
    } catch (error) {
      retryCount++;
      if (retryCount === MAX_RETRIES) {
        throw new Error(`Failed to upload chunk ${chunkIndex}: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
    }
  }
};

// Routes
router.post('/uploadMovie', async (req, res) => {
  try {
    const { image, video, backdrop } = req.files;

    validateFiles(image, video, backdrop);

    // Upload chunks in parallel
    await Promise.all([
      uploadChunk(image[0].buffer, 0, 1, image[0].originalname, 'image'),
      uploadChunk(video[0].buffer, 0, 1, video[0].originalname, 'video'),
      uploadChunk(backdrop[0].buffer, 0, 1, backdrop[0].originalname, 'backdrop')
    ]);

    const folderName = req.body.name || sanitizeFilename(req.query.name) || 'DefaultName';

    // Create links for database
    const link_image = sanitizeFilename(image[0].originalname);
    const link_video = `uploads/videos/${sanitizeFilename(Date.now() + '_' + folderName)}/master.m3u8`;
    const link_backdrop = sanitizeFilename(backdrop[0].originalname);

    // Save to database
    const [imageLink, videoLink, backdropLink] = await Promise.all([
      LinkImages.create({ link: link_image }),
      LinkVideos.create({ link: link_video }),
      LinkBackDrop.create({ link: link_backdrop })
    ]);


    res.json({
      success: true,
      message: "Movie uploaded successfully",
      data: {
        linkIMG: imageLink,
        linkVIDEO: videoLink,
        linkBACKDROP: backdropLink
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message
    });
  }
});


//// upload image
router.post(
  "/uploads_image",
  authenticate,
  upload.single("image"),
  handleMulterError,
  (req, res) => {
    const image = req.file.filename;
    const link = `${BASE_URL}/uploads/images/${image}`;
    LinkImages.create({ link })
      .then((link) => {
        res.json({
          success: true,
          message: "Link added successfully",
          data: link,
        });
      })
      .catch((err) => {
        res.status(500).json({
          success: false,
          message: "Database query failed",
          error: err.message,
        });
      });
  }
);


//// upload all
router.post(
  "/uploads_all",
  handleMulterError,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "backdrop", maxCount: 1 },
  ]), compressMiddleWare,

  async (req, res) => {
    try {
      if (!req.files) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const folderName = req.body.name || req.query.name || 'DefaultName';

      const image = req.files["image"][0].filename;
      // const video = req.files["video"][0].filename;
      const backdrop = req.files["backdrop"][0].filename;

      const link_image = `${sanitizeFilename(image)}`;
      const link_video = `uploads/videos/${sanitizeFilename(Date.now() + '_' + folderName)}/master.m3u8`;
      const link_backdrop = `${sanitizeFilename(backdrop)}`;

      const [imageLink, videoLink, backdropLink] = await Promise.all(
        [
          LinkImages.create({ link: link_image }),
          LinkVideos.create({ link: link_video }),
          LinkBackDrop.create({ link: link_backdrop }),
        ]
      );

      res.json({
        success: true,
        message: "Files uploaded successfully",
        data: {
          linkIMG: imageLink,
          linkVIDEO: videoLink,
          linkBACKDROP: backdropLink,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: err.message,
      });
    }
  }
);


router.post("/delete_file", async (req, res) => {
  try {
    const { linkImage, linkVideo, linkBackdrop } = req.body;

    const regex = /\/uploads\/(images|videos|backdrops)\/(.*)/;

    console.log(linkImage);
    console.log(linkVideo);
    console.log(linkBackdrop);

    const imageLink = await LinkImages.findOne({ where: { link: linkImage } });
    const videoLink = await LinkVideos.findOne({ where: { link: linkVideo } });
    const backdropLink = await LinkBackDrop.findOne({ where: { link: linkBackdrop } });
    let countDelete = 0;
    let deletedFiles = [];

    if (imageLink) {
      const filePath = path.join(__dirname, '..', '/uploads/images', linkImage[0]);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        await LinkImages.destroy({ where: { link: linkImage[0] } });
        countDelete++;
        deletedFiles.push('image delete : ' + filePath.split("\\").pop());
      }
    }

    if (videoLink) {
      const filePath = path.join(__dirname, '..', linkVideo[0]);
      const filePathFolder = path.dirname(filePath);
      console.log("FILE : " + filePathFolder);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePathFolder, { recursive: true, force: true });
        await LinkVideos.destroy({ where: { link: linkVideo[0] } });
        countDelete++;
        deletedFiles.push('video folder delete : ' + filePathFolder.split("\\").pop());
      }
    }

    if (backdropLink) {
      const filePath = path.join(__dirname, '..', '/uploads/backdrops', linkBackdrop[0]);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        await LinkBackDrop.destroy({ where: { link: linkBackdrop[0] } });
        countDelete++;
        deletedFiles.push('backdrop delete : ' + filePath.split("\\").pop());
      }
    }

    if (countDelete > 0) {
      res.json({
        success: true,
        message: "Files deleted successfully",
        deletedFiles: deletedFiles
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No files found to delete",
        details: {
          imageExists: !!imageLink,
          videoExists: !!videoLink,
          backdropExists: !!backdropLink
        }
      });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({
      success: false,
      message: "Error deleting files",
      error: err.message
    });
  }
});


//// get video or image
router.get("/get_assets", (req, res) => {
  const { linkVideo, linkImage, linkCast, linkBackdrop, nameTag, nameMovie } = req.query;

  console.log(linkVideo);

  if (linkVideo || linkImage || linkCast || linkBackdrop) {
    switch (nameTag) {
      case "poster":
        if (linkImage) {
          const imagePath = path.join(__dirname, '..', 'uploads', 'images', linkImage);
          if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
          } else {
            res.status(404).json({
              success: false,
              message: "Image not found"
            });
          }
        }
        break;
      case "backdrop":
        if (linkBackdrop) {
          const backdropPath = path.join(__dirname, '..', 'uploads', 'backdrops', linkBackdrop);
          if (fs.existsSync(backdropPath)) {
            res.sendFile(backdropPath);
          } else {
            res.status(404).json({
              success: false,
              message: "Backdrop not found"
            });
          }
        }
        break;
      case "video":
        if (linkVideo) {
          console.log(linkVideo);
          const videoPath = path.join(__dirname, '..', 'uploads', 'videos', linkVideo);
          if (fs.existsSync(videoPath)) {
            res.sendFile(videoPath);
          } else {
            res.status(404).json({
              success: false,
              message: "Video not found"
            });
          }
        }
        break;
      case "cast":
        if (linkCast) {
          console.log(nameMovie);
          console.log(linkCast);
          const castPath = path.join(__dirname, '..', 'uploads', 'casts', nameMovie, linkCast);
          if (fs.existsSync(castPath)) {
            res.sendFile(castPath);
          } else {
            res.status(404).json({
              success: false,
              message: "Cast not found"
            });
          }
        }
        break;

      default:
        res.status(400).json({
          success: false,
          message: "Invalid name tag"
        });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Link video or link image are required"
    });
  }
});


router.get('/assets/get_trailer', (req, res) => {
  const linkAssets = req.query.linkAssets; // Ex: uploads/videos/Novocaine/master.m3u8

  if (!linkAssets) {
    return res.status(400).send('Missing linkAssets parameter');
  }

  const filePath = path.join(__dirname, '..', linkAssets); // "../uploads/videos/Novocaine/master.m3u8"
  console.log('Sending file:', filePath);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});


router.get('/uploads/videos/:folder/:file', (req, res) => {
  const { folder, file } = req.params;
  const filePath = path.join(__dirname, '..', 'uploads', 'videos', folder, file);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('Serving video segment:', filePath);

    res.setHeader('Content-Type', 'video/mp2t');
    fs.createReadStream(filePath).pipe(res);
  });
});


const UPLOAD_TIMEOUT = 30 * 60 * 1000; // 30 phút
router.post('/uploadChunk',
  upload.single('chunk'),
  async (req, res) => {
    req.setTimeout(UPLOAD_TIMEOUT);
    res.setTimeout(UPLOAD_TIMEOUT);

    try {
      // Log để debug
      console.log('Upload chunk request body:', req.body);
      console.log('Upload chunk file:', req.file);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No chunk file uploaded"
        });
      }

      const { chunkIndex, totalChunks, fileName, fileType } = req.body;

      if (!chunkIndex || !totalChunks || !fileName || !fileType) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters",
          received: {
            chunkIndex,
            totalChunks,
            fileName,
            fileType
          }
        });
      }

      const tempDir = path.join('uploads', 'chunks', fileType, fileName);

      // Update progress
      const uploadedChunks = await fs.promises.readdir(tempDir);
      const progress = (uploadedChunks.length / totalChunks) * 100;

      res.json({
        success: true,
        message: 'Chunk uploaded successfully',
        progress,
        details: {
          fileType,
          fileName,
          chunkIndex,
          totalChunks
        }
      });
    } catch (error) {
      console.error('Chunk upload error:', error);
      res.status(500).json({
        success: false,
        message: "Chunk upload failed",
        error: error.message
      });
    }
  }
);

router.post('/completeUpload', async (req, res) => {
  try {
    const { movieDTO, imageName, videoName, backdropName } = req.body;

    if (!movieDTO || !imageName || !videoName || !backdropName) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters"
      });
    }

    const folderName = req.body.name || sanitizeFilename(req.query.name) || 'DefaultName';

    const dateNow = Date.now();
    // Gộp các file chunk
    const mergeChunks = async (fileType, fileName) => {
      const chunksDir = path.join('uploads', 'chunks', fileType, fileName);
      const outputDir = path.join('uploads', fileType === 'video' ? 'videos' : fileType === 'image' ? 'images' : 'backdrops');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const chunks = await fs.promises.readdir(chunksDir);
      chunks.sort((a, b) => {
        const indexA = parseInt(a.split('_')[1]);
        const indexB = parseInt(b.split('_')[1]);
        return indexA - indexB;
      });

      const outputFileName = fileType === 'video'
        ? `${dateNow}_${folderName}${path.extname(fileName)}`
        : `${dateNow}_${fileName}`;

      const outputPath = path.join(outputDir, outputFileName);
      const writeStream = fs.createWriteStream(outputPath);

      for (const chunk of chunks) {
        const chunkPath = path.join(chunksDir, chunk);
        const chunkData = await fs.promises.readFile(chunkPath);
        writeStream.write(chunkData);
      }

      writeStream.end();

      await fs.promises.rm(chunksDir, { recursive: true, force: true });

      const out = outputPath.replace(/\\/g, '/');

      return out;
    };

    const [imagePath, videoPath, backdropPath] = await Promise.all([
      mergeChunks('image', imageName),
      mergeChunks('video', videoName),
      mergeChunks('backdrop', backdropName)
    ]);

    const link_image = imagePath;
    const link_video = videoPath;
    const link_backdrop = backdropPath;

    const [imageLink, videoLink, backdropLink] = await Promise.all([
      LinkImages.create({ link: link_image }),
      LinkVideos.create({ link: link_video }),
      LinkBackDrop.create({ link: link_backdrop })
    ]);

    if (videoName) {

      console.log('Compressing video:', videoPath, 'to folder:', dateNow + '_' + folderName);

      compressVideoBackground(videoPath, dateNow + '_' + folderName);
    }

    const movieData = typeof movieDTO === 'string' ? JSON.parse(movieDTO) : movieDTO;

    // Tạo JSON hoàn chỉnh
    const completeMovieData = {
      ...movieData,
      imageUrl: `${link_image}`,
      videoUrl: `${link_video}`,
      backdropUrl: `${link_backdrop}`
    };

    res.json({
      success: true,
      message: "Upload completed successfully",
      data: completeMovieData
    });

  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({
      success: false,
      message: "Complete upload failed",
      error: error.message
    });
  }
});

router.post('/uploadCast', upload.array('cast'), async (req, res) => {
  try {
    const { movieName } = req.body;

    if (!movieName) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters"
      });
    }

    const uploadedFiles = req.files;

    const castData = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const castName = uploadedFiles[i].filename;
      castData.push(castName);
    }

    console.log(castData);

    res.json(castData);

  } catch (error) {
    console.error('Cast upload error:', error);
    res.status(500).json({
      success: false,
      message: "Cast upload failed",
      error: error.message
    });
  }
});

module.exports = router;