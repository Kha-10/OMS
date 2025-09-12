const sharp = require("sharp");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/aws");
const crypto = require("crypto");

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const validatePhotoUpload = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ msg: "Photo is required" });
  }

  try {
    req.randomImageNames = [];

    for (const file of req.files) {
      if (!file.mimetype.startsWith("image")) {
        return res.status(400).json({ msg: "All uploaded files must be images" });
      }

      const buffer = await sharp(file.buffer).webp({ quality: 70 }).toBuffer();

      const imageName = randomImageName();
      req.randomImageNames.push(imageName); 

      // Upload to S3
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageName,
        Body: buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);
    }
    next();
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ msg: "Image upload failed" });
  }
};

module.exports = validatePhotoUpload;