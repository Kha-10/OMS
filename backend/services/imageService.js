const s3 = require("../config/aws");
const cloudFront = require("../config/cloudFront");
const crypto = require("crypto");
const { CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");
const {
  DeleteObjectCommand,
  CopyObjectCommand,
} = require("@aws-sdk/client-s3");

const awsRemove = async (photosToDelete) => {
  try {
    for (const photo of photosToDelete) {
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: photo,
      };

      const command = new DeleteObjectCommand(params);
      await s3.send(command);
    }
  } catch (error) {
    console.error("Error deleting object:", error);
    throw new Error(error);
  }
};

const extractFilename = (url) => {
  try {
    return url.split("/").pop().split("?")[0]; // Extract filename before query params
  } catch (error) {
    console.error("Error extracting filename:", error);
    return null;
  }
};

const invalidateCloudFrontCache = async (photoPaths) => {
  try {
    const invalidationParams = {
      DistributionId: process.env.CLOUDFRONT_DIST_ID,
      InvalidationBatch: {
        Paths: {
          Quantity: photoPaths.length,
          Items: photoPaths.map((path) => `/${path}`),
        },
        CallerReference: `${Date.now()}`,
      },
    };

    const invalidationCommand = new CreateInvalidationCommand(
      invalidationParams
    );
    const response = await cloudFront.send(invalidationCommand);
  } catch (error) {
    console.error("CloudFront Invalidation Error:", error);
  }
};

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const duplicateImages = async (originalImages) => {
  try {
    const newImageNames = [];

    for (const originalKey of originalImages) {
      const newImageName = randomImageName();

      const copyParams = {
        Bucket: process.env.BUCKET_NAME,
        CopySource: `${process.env.BUCKET_NAME}/${originalKey}`,
        Key: newImageName,
      };

      await s3.send(new CopyObjectCommand(copyParams));
      newImageNames.push(newImageName);
    }

    return newImageNames;
  } catch (error) {
    console.error("Error duplicating images:", error);
    throw error;
  }
};

module.exports = {
  extractFilename,
  invalidateCloudFrontCache,
  awsRemove,
  duplicateImages,
};
