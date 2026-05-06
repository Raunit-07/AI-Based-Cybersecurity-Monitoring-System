import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ================= HASH PASSWORD =================
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * ================= COMPARE PASSWORD =================
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * ================= JSON SANITIZER =================
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.refreshToken;
  delete user.__v;

  return user;
};

/**
 * ================= MODEL EXPORT =================
 */
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;