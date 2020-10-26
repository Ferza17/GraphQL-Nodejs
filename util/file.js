/**
 * ========= Packages ==============
 */
const path = require("path");
const fs = require("fs");
/**
 * ========= End Packages ==============
 */
// Deleting image in static file
const clearImage = (filePath) => {
  (filePath = path), join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    console.log("err :>> ", err);
  });
};

module.exports = clearImage;
