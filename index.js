require("dotenv").config({ path: "./.env" });
const express = require("express");
const { app, sequelize } = require("./Database/database");
const movieRouter = require("./Services/MovieServices");
const jwtRouter = require("./JWT/JWT");
const port = process.env.PORT || 3000;
const seedDatabase = require("./Database/seed");
const multer = require('multer');
const path = require('path');

app.use(express.json());

app.use((req, res, next) => {
  console.log('Request:', req.method, req.url);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


const createTables = async () => {
  try {
    await sequelize.query(`
            CREATE TABLE IF NOT EXISTS link_videos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                link VARCHAR(255) NOT NULL
            )
        `);

    await sequelize.query(`
            CREATE TABLE IF NOT EXISTS link_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                link VARCHAR(255) NOT NULL
            )
        `);


    await sequelize.query(`
          CREATE TABLE IF NOT EXISTS link_backdrops (
              id INT AUTO_INCREMENT PRIMARY KEY,
              link VARCHAR(255) NOT NULL
          )
      `);

    await sequelize.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL
            )
        `);



    console.log("Links table created");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

createTables().then(async () => {
  await seedDatabase();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

const uploadsPath = path.join(__dirname, 'uploads');
console.log('Uploads serving from:', uploadsPath); //

app.use('/uploads', express.static(uploadsPath));

app.use("/api", movieRouter);
app.use("/auth", jwtRouter);

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;

console.log(`JWT Secret Key: ${jwtSecretKey}`);
console.log(`Token Header Key: ${tokenHeaderKey}`);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // thư mục lưu file
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post('/api/uploads_all', (req, res, next) => {
  console.log('Headers:', req.headers);
  console.log('Files:', req.files);
  console.log('Body:', req.body);
  next();
}, upload.single('video'), async (req, res) => {
  res.json({ message: 'File uploaded successfully' });
});
