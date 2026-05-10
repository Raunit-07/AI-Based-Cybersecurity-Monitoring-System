import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // ================= EMAIL =================
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // ================= PASSWORD =================
    password: {
      type: String,
      required: [true, "Password is required"],

      minlength: [
        8,
        "Password must be at least 8 characters long",
      ],

      select: false,
    },

    // ================= ROLE =================
    role: {
      type: String,

      enum: ["user", "admin"],

      default: "user",
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
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ================= HASH PASSWORD + GENERATE API KEY =================
 */
userSchema.pre("save", async function () {

  // ================= HASH PASSWORD =================
  if (this.isModified("password")) {

    const salt = await bcrypt.genSalt(12);

    this.password = await bcrypt.hash(
      this.password,
      salt
    );
  }

  // ================= GENERATE API KEY =================
  // Only generate on initial user creation
  // NOT on every save (apiKey is select:false, so it's undefined on loaded docs)
  if (this.isNew && !this.apiKey) {

    this.apiKey = crypto
      .randomBytes(32)
      .toString("hex");
  }
});

/**
 * ================= COMPARE PASSWORD =================
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
 * ================= SAFE JSON OUTPUT =================
 */
userSchema.methods.toJSON =
  function () {

    const user = this.toObject();

    delete user.password;
    delete user.refreshToken;
    delete user.apiKey;
    delete user.__v;

    return user;
  };

/**
 * ================= SAFE MODEL EXPORT =================
 */
const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

export default User;