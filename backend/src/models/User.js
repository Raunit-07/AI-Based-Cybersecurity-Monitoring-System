import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /**
     * ============================================
     * EMAIL
     * ============================================
     */
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /**
     * ============================================
     * PASSWORD
     * ============================================
     */
    password: {
      type: String,
      required: [true, "Password required"],
      minlength: [8, "Password must contain minimum 8 characters"],
      select: false,
    },

    /**
     * ============================================
     * ROLE
     * ============================================
     */
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /**
     * ============================================
     * ORGANIZATION
     * ============================================
     */
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    /**
     * ============================================
     * API KEY
     * ============================================
     */
    apiKey: {
      type: String,
      unique: true,
      select: false,
      index: true,
    },

    /**
     * ============================================
     * REFRESH TOKEN
     * ============================================
     */
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    /**
     * ============================================
     * ACTIVE STATUS
     * ============================================
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * ============================================
     * LAST LOGIN
     * ============================================
     */
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ============================================
 * INDEXES
 * ============================================
 */

userSchema.index({
  organizationId: 1,
});

userSchema.index({
  role: 1,
});

/**
 * ============================================
 * HASH PASSWORD + GENERATE API KEY
 * ============================================
 *
 * NOTE:
 * Async middleware should NOT use next()
 * Mongoose waits automatically.
 */

userSchema.pre("save", async function () {
  /**
   * Hash password only if modified
   */
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);

    this.password = await bcrypt.hash(
      this.password,
      salt
    );
  }

  /**
   * Generate API key once
   */
  if (this.isNew && !this.apiKey) {
    this.apiKey = crypto
      .randomBytes(32)
      .toString("hex");
  }
});

/**
 * ============================================
 * COMPARE PASSWORD
 * ============================================
 */

userSchema.methods.comparePassword =
async function (candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false;
  }

  return bcrypt.compare(
    candidatePassword,
    this.password
  );
};

/**
 * ============================================
 * HASH TOKEN
 * ============================================
 */

userSchema.methods.hashToken =
function (token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

/**
 * ============================================
 * SAFE RESPONSE
 * ============================================
 */

userSchema.methods.toJSON =
function () {
  const user = this.toObject();

  delete user.password;
  delete user.refreshToken;
  delete user.apiKey;

  return user;
};

/**
 * ============================================
 * EXPORT
 * ============================================
 */

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );

export default User;