const User = require("../models/User");
const Listing = require("../models/Listing");

// ADD / REMOVE FAVORITE
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId } = req.params;

    // Make sure listing exists
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const alreadySaved = user.saved.some(
      (id) => id.toString() === listingId
    );

    if (alreadySaved) {
      // REMOVE FROM FAVORITES

      user.saved = user.saved.filter(
        (id) => id.toString() !== listingId
      );

      await user.save();

      return res.status(200).json({
        message: "Listing removed from favorites",
        isFavorite: false,
      });
    }

    // ADD TO FAVORITES

    user.saved.push(listing._id);

    await user.save();

    return res.status(200).json({
      message: "Listing added to favorites",
      isFavorite: true,
    });

  } catch (error) {
    console.error(
      "TOGGLE FAVORITE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to update favorite",
    });
  }
};

const clearFavorites = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          saved: [],
        },
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
      message: "All favorites cleared successfully",
      favorites: user.saved,
    });

  } catch (error) {
    console.error("CLEAR FAVORITES ERROR:", error);

    return res.status(500).json({
      message: "Failed to clear favorites",
    });
  }
};

module.exports = {
  toggleFavorite,
  clearFavorites,
};