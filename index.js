require("dotenv").config({ path: "./.env" });
const express = require("express");
const { app, db } = require("./Database/database");
const movieRouter = require("./Movie");
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", movieRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;

console.log(`JWT Secret Key: ${jwtSecretKey}`);
console.log(`Token Header Key: ${tokenHeaderKey}`);
