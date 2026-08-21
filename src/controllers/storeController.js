const Store = require("../models/Store");
const User = require("../models/User");

const createStore = async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      phone,
      location,
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

    const store = await Store.create({
      name,
      description: description || "",
      logo: logo || "",
      phone: phone || "",
      location: location || {},
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

module.exports = {
  createStore,
  followStore,
  unfollowStore,
  getStores
};