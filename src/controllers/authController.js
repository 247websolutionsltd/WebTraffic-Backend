const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const Listing = require("../models/Listing");
const Store = require("../models/Store");

const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const resend = require("../config/email");
const crypto = require("crypto");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// REGISTER
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    console.log("USER CREATED:", user._id);

    const token = generateToken(user);

    console.log("TOKEN CREATED");

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage,
        phone: user.phone,
        store: user.store,
        stores: user.stores,
        role: user.role,
        saved: user.saved
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User
      .findOne({ email })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "This account uses Google authentication",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage,
        phone: user.phone,
        store: user.store,
        stores: user.stores,
        role: user.role,
        saved: user.saved
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// GOOGLE LOGIN
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        message: "Google ID token is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture,
    } = payload;
    console.log(payload)

    let user = await User.findOne({
      $or: [
        { googleId },
        { email },
      ],
    });

    if (!user) {
      user = await User.create({
        firstName: firstName || "",
        lastName: lastName || "",
        email,
        googleId,
        profileImage: picture || "",
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.profileImage = picture || user.profileImage;
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage,
        phone: user.phone,
        store: user.store,
        stores: user.stores,
        role: user.role,
        saved: user.saved
      },
    });
  } catch (error) {
    console.error("Google authentication error:", error);

    res.status(401).json({
      message: "Invalid Google ID token",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password"
    ).populate("store")
    .populate("stores", "name profileImage");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage,
        phone: user.phone,
        store: user.store,
        stores: user.stores,
        role: user.role,
        saved: user.saved
      },
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    session.startTransaction();

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Account not found",
      });
    }

    const userId = user._id;

    // Find listings
    const listings = await Listing.find({
      seller: userId,
    })
      .select("_id")
      .session(session);

    const listingIds = listings.map(
      (listing) => listing._id
    );

    // Find stores
    const stores = await Store.find({
      owner: userId,
    })
      .select("_id")
      .session(session);

    const storeIds = stores.map(
      (store) => store._id
    );

    // Remove listings from favorites
    if (listingIds.length > 0) {
      await User.updateMany(
        {
          saved: {
            $in: listingIds,
          },
        },
        {
          $pull: {
            saved: {
              $in: listingIds,
            },
          },
        },
        { session }
      );
    }

    // Remove stores from followers
    if (storeIds.length > 0) {
      await User.updateMany(
        {
          followingStores: {
            $in: storeIds,
          },
        },
        {
          $pull: {
            followingStores: {
              $in: storeIds,
            },
          },
        },
        { session }
      );
    }

    // Anonymize messages
    await Message.updateMany(
      {
        sender: userId,
      },
      {
        $set: {
          sender: null,
        },
      },
      { session }
    );

    // Remove user from conversations
    await Conversation.updateMany(
      {
        buyer: userId,
      },
      {
        $set: {
          buyer: null,
        },
      },
      { session }
    );

    await Conversation.updateMany(
      {
        seller: userId,
      },
      {
        $set: {
          seller: null,
        },
      },
      { session }
    );

    // Delete listings
    if (listingIds.length > 0) {
      await Listing.deleteMany(
        {
          _id: {
            $in: listingIds,
          },
        },
        { session }
      );
    }

    // Delete stores
    if (storeIds.length > 0) {
      await Store.deleteMany(
        {
          _id: {
            $in: storeIds,
          },
        },
        { session }
      );
    }

    // Delete user
    await User.deleteOne(
      {
        _id: userId,
      },
      { session }
    );

    await session.commitTransaction();

    return res.status(200).json({
      message: "Account deleted successfully",
    });

  } catch (error) {
    await session.abortTransaction();

    console.error(
      "DELETE ACCOUNT ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to delete account. Please try again.",
    });

  } finally {
    await session.endSession();
  }
};

const requestAccountDeletion = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.user.email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash in MongoDB
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.deleteAccountToken = hashedToken;

    // Token expires in 30 minutes
    user.deleteAccountTokenExpires = new Date(
      Date.now() + 30 * 60 * 1000
    );

    await user.save();

    // URL the user will click
    const deletionUrl =
      `${process.env.FRONTEND_URL}/delete-account/${rawToken}`;

    const resend = require("../config/email");

    await resend.emails.send({
      from: "WebTraffic <onboarding@resend.dev>",
      to: user.email,

      subject: "Confirm your WebTraffic account deletion",

      html: `
        <!DOCTYPE html>
        <html>
          <body style="
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            padding: 40px;
          ">

            <div style="
              max-width: 600px;
              margin: auto;
              background: white;
              padding: 40px;
              border-radius: 10px;
            ">

              <h2>Confirm Account Deletion</h2>

              <p>
                Hello ${user.firstName},
              </p>

              <p>
                We received a request to permanently delete
                your WebTraffic account.
              </p>

              <p>
                If you requested this, click the button below
                to confirm the deletion.
              </p>

              <div style="
                text-align: center;
                margin: 30px 0;
              ">

                <a
                  href="${deletionUrl}"
                  style="
                    display: inline-block;
                    padding: 15px 25px;
                    background: #d32f2f;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                  "
                >
                  Confirm Account Deletion
                </a>

              </div>

              <p>
                This link will expire in 30 minutes.
              </p>

              <p>
                If you did not request this, you can safely
                ignore this email.
              </p>

            </div>

          </body>
        </html>
      `,
    });

    return res.status(200).json({
      message:
        "A confirmation email has been sent to your email address.",
    });

  } catch (error) {
    console.error(
      "DELETE REQUEST ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to send account deletion email.",
    });
  }
};

const confirmAccountDeletion = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send(`
        <h2>Invalid deletion link</h2>
      `);
    }

    // Hash token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user
    const user = await User.findOne({
      deleteAccountToken: hashedToken,
      deleteAccountTokenExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial; padding: 40px;">
            <h2>Link expired or invalid</h2>

            <p>
              This account deletion link is no longer valid.
              Please request a new deletion link from the app.
            </p>
          </body>
        </html>
      `);
    }

    /*
     * At this point the user has clicked
     * the valid confirmation link.
     *
     * Now perform your deletion process.
     */

    const userId = user._id;

    // Find listings
    const listings = await Listing.find({
      seller: userId,
    }).select("_id");

    const listingIds = listings.map(
      listing => listing._id
    );

    // Find stores
    const stores = await Store.find({
      owner: userId,
    }).select("_id");

    const storeIds = stores.map(
      store => store._id
    );

    // Remove user's listings from favorites
    if (listingIds.length > 0) {
      await User.updateMany(
        {
          saved: {
            $in: listingIds,
          },
        },
        {
          $pull: {
            saved: {
              $in: listingIds,
            },
          },
        }
      );
    }

    // Remove user's stores from followers
    if (storeIds.length > 0) {
      await User.updateMany(
        {
          followingStores: {
            $in: storeIds,
          },
        },
        {
          $pull: {
            followingStores: {
              $in: storeIds,
            },
          },
        }
      );
    }

    // Anonymize messages
    await Message.updateMany(
      {
        sender: userId,
      },
      {
        $set: {
          sender: null,
        },
      }
    );

    // Remove user from conversations
    await Conversation.updateMany(
      {
        buyer: userId,
      },
      {
        $set: {
          buyer: null,
        },
      }
    );

    await Conversation.updateMany(
      {
        seller: userId,
      },
      {
        $set: {
          seller: null,
        },
      }
    );

    // Delete listings
    if (listingIds.length > 0) {
      await Listing.deleteMany({
        _id: {
          $in: listingIds,
        },
      });
    }

    // Delete stores
    if (storeIds.length > 0) {
      await Store.deleteMany({
        _id: {
          $in: storeIds,
        },
      });
    }

    // Delete user
    await User.deleteOne({
      _id: userId,
    });

    // Confirmation page
    return res.status(200).send(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>Account Deleted</title>
        </head>

        <body style="
          font-family: Arial;
          text-align: center;
          padding: 60px 20px;
        ">

          <h1>Account Deleted</h1>

          <p>
            Your WebTraffic account has been successfully deleted.
          </p>

          <p>
            You can close this page.
          </p>

        </body>
      </html>
    `);

  } catch (error) {
    console.error(
      "CONFIRM DELETE ERROR:",
      error
    );

    return res.status(500).send(`
      <h2>Something went wrong</h2>
      <p>
        We couldn't complete your account deletion.
        Please try again later.
      </p>
    `);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getUser,
  deleteAccount,
  requestAccountDeletion,
  confirmAccountDeletion
};