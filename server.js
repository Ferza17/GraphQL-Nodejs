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
 * ========= Middleware ==============
 */
const auth = require("./middleware/auth");
/**
 * ========= End Middleware ==============
 */
/**
 * ========= Util ==============
 */
const { clearImage } = require("./util/file");
/**
 * ========= End Util ==============
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
 * ========= End Global Variable ==============
 */
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

// Setting CORS Headers and Graphql
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error("Not Authorized!");
    throw error;
  }

  if (!req.file) {
    return res.status(200).json({
      message: "No File Provided!",
    });
  }

  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(201).json({
    message: "File stored!",
    filePath: req.file.path,
  });
});

// Adding Middleware to Auth User
app.use(auth);

// Graphql
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: grahpqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }

      const data = err.originalError.data;
      const message = err.message || "An Error Occured!";
      const code = err.originalError.code || 500;
      return {
        message: message,
        status: code,
        data: data,
      };
    },
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
