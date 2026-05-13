import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // ================= EMAIL =================
    email: {
      type: String,

      required: [
        true,
        "Email is required",
      ],

      unique: true,

      lowercase: true,

      trim: true,

      index: true,
    },

    // ================= PASSWORD =================
    password: {
      type: String,

      required: [
        true,
        "Password is required",
      ],

      minlength: [
        8,
        "Password must be at least 8 characters long",
      ],

      select: false,
    },

    // ================= ROLE =================
    role: {
      type: String,

      enum: [
        "user",
        "admin",
      ],

      default: "user",
    },

    // ================= ORGANIZATION =================
    organizationId: {
      type:
        mongoose.Schema.Types
          .ObjectId,

      ref: "Organization",

      default: null,

      index: true,
    },

    // ================= USER API KEY =================
    apiKey: {
      type: String,

      unique: true,

      index: true,

      select: false,
    },

    // ================= REFRESH TOKEN =================
    refreshToken: {
      type: String,

      default: null,

      select: false,
    },

    // ================= ACTIVE STATUS =================
    isActive: {
      type: Boolean,

      default: true,
    },

    // ================= LAST LOGIN =================
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

// ================= INDEXES =================
userSchema.index({
  email: 1,
});

userSchema.index({
  organizationId: 1,
});

userSchema.index({
  role: 1,
});

// ================= HASH PASSWORD + GENERATE API KEY =================
userSchema.pre(
  "save",
  async function () {
    try {
      // ================= HASH PASSWORD =================
      if (
        this.isModified(
          "password"
        )
      ) {
        const salt =
          await bcrypt.genSalt(
            12
          );

        this.password =
          await bcrypt.hash(
            this.password,
            salt
          );
      }

      // ================= GENERATE API KEY =================
      // only on initial creation
      if (
        this.isNew &&
        !this.apiKey
      ) {
        this.apiKey =
          crypto
            .randomBytes(32)
            .toString("hex");
      }
    } catch (error) {
      throw error;
    }
  }
);

// ================= COMPARE PASSWORD =================
userSchema.methods.comparePassword =
  async function (
    candidatePassword
  ) {
    if (
      !candidatePassword ||
      !this.password
    ) {
      return false;
    }

    return bcrypt.compare(
      candidatePassword,
      this.password
    );
  };

// ================= SAFE JSON OUTPUT =================
userSchema.methods.toJSON =
  function () {
    const user =
      this.toObject();

    delete user.password;

    delete user.refreshToken;

    delete user.apiKey;

    delete user.__v;

    return user;
  };

// ================= SAFE MODEL EXPORT =================
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );

export default User;