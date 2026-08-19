const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const User = require("../models/User");

const updateProfileImage = async (req, res) => {
  try {

    console.log("PROFILE IMAGE REQUEST RECEIVED");

    console.log("USER:", req.user);

    console.log("FILE:", req.file);
    // Make sure an image was provided
    if (!req.file) {
      return res.status(400).json({
        message: "Profile image is required",
      });
    }

    console.log("FILE NAME:", req.file.originalname);
    console.log("FILE TYPE:", req.file.mimetype);
    console.log("FILE SIZE:", req.file.size);
    console.log("HAS BUFFER:", !!req.file.buffer);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "webtraffic/profile-images",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier
        .createReadStream(req.file.buffer)
        .pipe(stream);
    });

    // Update user's profile image
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        profileImage: result.secure_url,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile image updated successfully",
      profileImage: user.profileImage,
    });

  } catch (error) {
    console.error("PROFILE IMAGE ERROR:", error);

    return res.status(500).json({
      message: "Failed to update profile image",
      error: error.message,
    });
  }
};

module.exports = {
  updateProfileImage,
};