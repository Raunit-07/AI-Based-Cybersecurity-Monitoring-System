import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";

import logger from "../utils/logger.js";

/**
 * ============================================
 * CREATE APP ERROR
 * ============================================
 */
const createError = (
  message,
  status = 500
) => {

  const error = new Error(
    message
  );

  error.status = status;

  return error;
};


/**
 * ============================================
 * TOKEN GENERATION
 * ============================================
 */
const generateTokens = (
  userId,
  role = "user"
) => {

  if (
    !process.env.JWT_ACCESS_SECRET ||
    !process.env.JWT_REFRESH_SECRET
  ) {

    throw createError(
      "JWT secrets missing",
      500
    );

  }

  const payload = {

    id: userId.toString(),

    role

  };

  const accessToken =
    jwt.sign(

      payload,

      process.env.JWT_ACCESS_SECRET,

      {

        expiresIn:
          process.env
            .JWT_ACCESS_EXPIRES_IN ||
          "15m"

      }

    );

  const refreshToken =
    jwt.sign(

      payload,

      process.env.JWT_REFRESH_SECRET,

      {

        expiresIn:
          process.env
            .JWT_REFRESH_EXPIRES_IN ||
          "7d"

      }

    );

  return {

    accessToken,

    refreshToken

  };

};



/**
 * ============================================
 * SAFE USER RESPONSE
 * ============================================
 */
const buildSafeUser = (user) => {

  if (!user) return null;

  return {

    id:
      user._id?.toString(),

    email:
      user.email,

    role:
      user.role,

    apiKey:
      user.apiKey || null,

    createdAt:
      user.createdAt,

    updatedAt:
      user.updatedAt

  };

};



/**
 * ============================================
 * EMAIL NORMALIZER
 * ============================================
 */
const normalizeEmailForDb =
  (email) => {

    return String(
      email || ""
    )
      .trim()
      .toLowerCase();

  };



/**
 * ============================================
 * REGISTER
 * ============================================
 */
const registerUser =
  async (
    email,
    password
  ) => {

    if (
      !email ||
      !password
    ) {

      throw createError(
        "Email and password required",
        400
      );

    }

    const normalizedEmail =
      normalizeEmailForDb(
        email
      );

    const existingUser =
      await User.findOne({

        email:
          normalizedEmail

      });

    if (
      existingUser
    ) {

      throw createError(
        "User already exists",
        409
      );

    }


    const user =
      new User({

        email:
          normalizedEmail,

        password,

        role:
          "user"

      });


    const {

      accessToken,

      refreshToken

    } = generateTokens(

      user._id,

      user.role

    );


    /**
     * Save refresh token
     */

    user.refreshToken =
      refreshToken;

    await user.save();


    logger.info(
      `User registered: ${normalizedEmail}`
    );


    return {

      user:
        buildSafeUser(
          user
        ),

      accessToken,

      refreshToken

    };

  };



/**
 * ============================================
 * LOGIN
 * ============================================
 */
const loginUser =
  async (
    email,
    password
  ) => {


    if (
      !email ||
      !password
    ) {

      throw createError(
        "Invalid credentials",
        401
      );

    }


    const normalizedEmail =
      normalizeEmailForDb(
        email
      );


    const user =
      await User.findOne({

        email:
          normalizedEmail

      })
        .select(
          "+password +apiKey +refreshToken"
        );


    if (
      !user
    ) {

      throw createError(
        "Invalid credentials",
        401
      );

    }


    const isMatch =
      await user.comparePassword(
        password
      );


    if (
      !isMatch
    ) {

      throw createError(
        "Invalid credentials",
        401
      );

    }


    const {

      accessToken,

      refreshToken

    } = generateTokens(

      user._id,

      user.role

    );


    user.refreshToken =
      refreshToken;

    await user.save();


    logger.info(
      `User logged in: ${normalizedEmail}`
    );


    return {

      user:
        buildSafeUser(
          user
        ),

      accessToken,

      refreshToken

    };

  };



/**
 * ============================================
 * REFRESH TOKEN
 * ============================================
 */
const refreshAuthToken =
  async (
    token
  ) => {


    if (
      !token
    ) {

      throw createError(
        "No refresh token",
        401
      );

    }


    let decoded;


    try {

      decoded =
        jwt.verify(

          token,

          process.env
            .JWT_REFRESH_SECRET

        );

    }
    catch {

      throw createError(
        "Invalid refresh token",
        403
      );

    }


    const user =
      await User.findById(

        decoded.id

      )
        .select(
          "+refreshToken"
        );


    if (
      !user
    ) {

      throw createError(
        "User not found",
        404
      );

    }


    if (
      user.refreshToken
      !== token
    ) {

      throw createError(
        "Refresh token mismatch",
        403
      );

    }


    const {

      accessToken,

      refreshToken: newRefreshToken

    } = generateTokens(

      user._id,

      user.role

    );


    user.refreshToken =
      newRefreshToken;

    await user.save();


    return {

      accessToken,

      refreshToken:
        newRefreshToken

    };

  };



/**
 * ============================================
 * LOGOUT
 * ============================================
 */
const logoutUser =
  async (
    userId
  ) => {

    if (
      !userId
    ) return;


    await User.findByIdAndUpdate(

      userId,

      {

        refreshToken:
          null

      }

    );


    logger.info(
      `User logout: ${userId}`
    );

  };



/**
 * ============================================
 * GET USER API KEY
 * ============================================
 */
const getUserApiKey =
  async (
    userId
  ) => {

    const user =
      await User.findById(
        userId
      )
        .select(
          "+apiKey"
        );

    if (
      !user
    ) {

      throw createError(
        "User not found",
        404
      );

    }

    return user.apiKey;

  };



/**
 * ============================================
 * REGENERATE API KEY
 * ============================================
 */
const regenerateApiKey =
  async (
    userId
  ) => {

    const newApiKey =
      crypto
        .randomBytes(32)
        .toString(
          "hex"
        );


    const user =
      await User.findByIdAndUpdate(

        userId,

        {

          apiKey:
            newApiKey

        },

        {

          new: true

        }

      )
        .select(
          "+apiKey"
        );


    if (
      !user
    ) {

      throw createError(
        "User not found",
        404
      );

    }


    logger.info(
      `API regenerated: ${userId}`
    );


    return user.apiKey;

  };


export default {

  registerUser,

  loginUser,

  refreshAuthToken,

  logoutUser,

  getUserApiKey,

  regenerateApiKey

};