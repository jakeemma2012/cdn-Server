const express = require("express");
const router = express.Router();
const { db } = require("../Database/database");
const jwt = require("jsonwebtoken");
const jwtSecretKey = process.env.JWT_SECRET_KEY;
const Movie = require("../Models/Movie");
const BASE_URL = process.env.BASE_URL;
const { upload, handleMulterError } = require("../Files/FileHandler");
const path = require("path");
const fs = require("fs");
const movie_cast = require("../Models/MovieCast");
const LinkVideos = require("../Models/LinkVideos");
const LinkImages = require("../Models/LinkImages");
const { sanitizeFilename } = require("../Utils/process");



//// authenticate
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

//// upload video
router.post(
  "/uploads_video",
  upload.single("video"),
  handleMulterError,
  (req, res) => {
    console.log("has ping to this route");
    const video = req.file.filename;
    const link = `${BASE_URL}/uploads/videos/${video}`;

    LinkVideos.create({ link })
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
  ]),

  async (req, res) => {
    try {
      if (!req.files) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const image = req.files["image"][0].filename;
      const video = req.files["video"][0].filename;

      const link_image = `${sanitizeFilename(image)}`;
      const link_video = `${sanitizeFilename(video)}`;

      const [imageLink, videoLink] = await Promise.all([
        LinkImages.create({ link: link_image }),
        LinkVideos.create({ link: link_video }),
      ]);

      res.json({
        success: true,
        message: "Files uploaded successfully",
        data: {
          linkIMG: imageLink,
          linkVIDEO: videoLink,
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
    const { linkImage, linkVideo } = req.body;

    const regex = /\/uploads\/(images|videos)\/(.*)/;

    console.log(linkImage);
    console.log(linkVideo);
    const imageLink = await LinkImages.findOne({ where: { link: linkImage } });
    const videoLink = await LinkVideos.findOne({ where: { link: linkVideo } });

    let countDelete = 0;
    let deletedFiles = [];

    if (imageLink) {
      const matchImage = linkImage[0].match(regex);
      if (matchImage) {
        const filePath = path.join(__dirname, '..', matchImage[0]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          await LinkImages.destroy({ where: { link: linkImage[0] } });
          countDelete++;
          deletedFiles.push('image delete : ' + filePath.split("\\").pop());
        }
      }
    }

    if (videoLink) {
      const matchVideo = linkVideo[0].match(regex);
      if (matchVideo) {
        const filePath = path.join(__dirname, '..', matchVideo[0]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          await LinkVideos.destroy({ where: { link: linkVideo[0] } });
          countDelete++;
          deletedFiles.push('video delete : ' + filePath.split("\\").pop());
        }
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
          videoExists: !!videoLink
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
  const { linkVideo, linkImage } = req.query;

  // console.log(linkVideo);
  // console.log(linkImage);

  if (linkVideo || linkImage) {
    if (linkVideo) {
      const videoPath = path.join(__dirname, '..', 'uploads', 'videos', linkVideo);
      if (fs.existsSync(videoPath)) {
        res.sendFile(videoPath);
      } else {
        res.status(404).json({
          success: false,
          message: "Video not found"
        });
      }
    } else {
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
  } else {
    res.status(400).json({
      success: false,
      message: "Link video or link image are required"
    });
  }
});

module.exports = router;