let adapter;

if (process.env.UPLOAD_PROVIDER === "cloudinary") {
  adapter = require("./cloudinaryAdapter");
} else {
  adapter = require("./awsAdapter");
}

module.exports = adapter;
