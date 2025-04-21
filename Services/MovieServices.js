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
const LinkBackDrop = require("../Models/LinkBackDrop");



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
    { name: "backdrop", maxCount: 1 },
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
      const backdrop = req.files["backdrop"][0].filename;

      const link_image = `${sanitizeFilename(image)}`;
      const link_video = `${sanitizeFilename(video)}`;
      const link_backdrop = `${sanitizeFilename(backdrop)}`;

      const [imageLink, videoLink, backdropLink] = await Promise.all([
        LinkImages.create({ link: link_image }),
        LinkVideos.create({ link: link_video }),
        LinkBackDrop.create({ link: link_backdrop }),
      ]);

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

    if (backdropLink) {
      const matchBackdrop = linkBackdrop[0].match(regex);
      if (matchBackdrop) {
        const filePath = path.join(__dirname, '..', matchBackdrop[0]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          await LinkBackDrop.destroy({ where: { link: linkBackdrop[0] } });
          countDelete++;
          deletedFiles.push('backdrop delete : ' + filePath.split("\\").pop());
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

module.exports = router;