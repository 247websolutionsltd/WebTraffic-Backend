const Store = require("../models/Store");
const User = require("../models/User");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const createStore = async (req, res) => {
  try {
    const {
      name,
      description,
      handle,
      category,
      image,
      city,
      state,
      country
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Store name is required",
      });
    }

    // Check whether this user already owns a store
    const existingStore = await Store.findOne({
      owner: req.user.id,
    });
    

    if (existingStore) {
      return res.status(409).json({
        message: "You already have a store",
      });
    }
    console.log(req.files);
    const uploadedImage = await new Promise(
      (resolve, reject) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder: "webtraffic/store-images",
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
          .pipe(uploadStream);
      }
    );
    console.log("Cloudinary images:");
    console.log(uploadedImage);

   

    const store = await Store.create({
      name: name.trim(),
      description: description.trim(),
      logo: uploadedImage.url,
      phone: req.user.phone || "",
      location: {
        city: city || "",
        state: state || "",
        country: country || "Nigeria",
      },
      followerCount:0,
      isactive:true,
      owner: req.user.id,
    });

    // Assign the store to the user's `store` field
    await User.findByIdAndUpdate(
      req.user.id,
      {
        store: store._id,
      }
    );

    res.status(201).json({
      message: "Store created successfully",
      store,
    });

  } catch (error) {
    console.error("CREATE STORE ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const followStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    // Prevent following the same store twice
    const alreadyFollowing = await User.exists({
      _id: req.user.id,
      stores: storeId,
    });

    if (alreadyFollowing) {
      return res.status(409).json({
        message: "You already follow this store",
      });
    }

    await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: {
          stores: storeId,
        },
      }
    );

    await Store.findByIdAndUpdate(
      storeId,
      {
        $inc: {
          followersCount: 1,
        },
      }
    );

    res.json({
      message: "Store followed successfully",
    });

  } catch (error) {
    console.error("FOLLOW STORE ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const unfollowStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    const result = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          stores: storeId,
        },
      },
      {
        new: true,
      }
    );

    if (!result) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await Store.findByIdAndUpdate(
      storeId,
      {
        $inc: {
          followersCount: -1,
        },
      }
    );

    res.json({
      message: "Store unfollowed successfully",
    });

  } catch (error) {
    console.error("UNFOLLOW STORE ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getStores = async (req, res) => {
  try {
    const stores = await Store.find({
      isActive: true,
    })
      .populate(
        "owner",
        "firstName lastName profileImage"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      stores,
    });

  } catch (error) {
    console.error("GET STORES ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getMyStore = async (req, res) => {
  console.log(req.user.id)
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid store ID",
      });
    }

    const store = await Store.findById(req.params)
      .populate(
        "owner",
        "firstName lastName email profileImage"
      )
      .populate("listings")
      .populate(
        "followers",
        "firstName lastName profileImage"
      );

    if (!store) {
      return res.status(404).json({
        message: "You don't have a store yet",
      });
    }

    return res.status(200).json({
      store,
    });

  } catch (error) {
    console.error("GET MY STORE ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch your store",
    });
  }
};

const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id)
      .populate(
        "owner",
        "firstName lastName profileImage phone"
      )
      .populate(
        "followers",
        "firstName lastName profileImage"
      )
      .populate(
        "listings",
        "title price images condition"
      );

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    return res.status(200).json({
      store,
    });

  } catch (error) {
    console.error("GET STORE ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch store",
    });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      firstName,
      lastName,
      phone,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update only fields that were actually provided
    if (firstName !== undefined) {
      user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      user.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    // Upload new profile image if provided
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file,
        "webtraffic/users/profile"
      );

      user.profileImage = result.secure_url;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};


const updateMyStore = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      description,
      phone,
      email,
      city,
      state,
      country,
    } = req.body;

    const store = await Store.findOne({
      owner: userId,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "You don't have a store",
      });
    }

    if (name !== undefined) {
      store.name = name.trim();
    }

    if (description !== undefined) {
      store.description = description.trim();
    }

    if (phone !== undefined) {
      store.phone = phone.trim();
    }

    if (email !== undefined) {
      store.email = email.trim().toLowerCase();
    }

    if (city !== undefined) {
      store.location.city = city.trim();
    }

    if (state !== undefined) {
      store.location.state = state.trim();
    }

    if (country !== undefined) {
      store.location.country = country.trim();
    }

    // New logo
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file,
        "webtraffic/stores/logos"
      );

      store.logo = result.secure_url;
    }

    await store.save();

    return res.status(200).json({
      success: true,
      message: "Store updated successfully",
      store,
    });

  } catch (error) {
    console.error("UPDATE STORE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update store",
    });
  }
};


module.exports = {
  createStore,
  followStore,
  unfollowStore,
  getStores,
  getMyStore,
  getStoreById,
  updateMyStore,
  updateMyProfile
};