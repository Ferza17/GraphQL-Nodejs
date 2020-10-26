/**
 * ========= Packages ==============
 */
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require("http");
const multer = require("multer");
require("dotenv/config");
// For Windows User
const { uuidv4 } = require("uuid");
const { graphqlHTTP } = require("express-graphql");
/**
 * ========= End Packages ==============
 */
/**
 * ========= Global Variable ==============
 */
const app = express();

// Graphql Schema
const graphqlSchema = require("./graphql/schema");
const grahpqlResolver = require("./graphql/resolvers");

/**
 * ========= Global Variable ==============
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4());
  },
});

const filter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    return cb(null, true);
  } else {
    cb(null, false);
  }
};
/**
 * ========= Initialize  ==============
 */
app.use(bodyParser.json());
app.use(
  multer({
    storage: storage,
    fileFilter: filter,
  }).single("image")
);

app.use("/images", express.static(path.join(__dirname, "images")));

// Graphql
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: grahpqlResolver,
    graphiql: true,
  })
);

app.use((error, req, res, next) => {
  console.log("error :>> ", error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data,
  });
});
/**
 * ========= End Initialize ==============
 */
mongoose
  .connect(process.env.MONGODB_URL)
  .then((result) => {
    http.createServer(app).listen(process.env.PORT);
  })
  .catch((err) => {
    console.log("err :>> ", err);
  });
