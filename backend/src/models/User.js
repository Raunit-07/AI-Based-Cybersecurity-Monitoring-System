import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ================= SCHEMA =================
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // 🔐 never return password by default
    },
    role: {
      type: String,
      enum: ["admin", "analyst", "viewer"],
      default: "viewer",
    },
    refreshToken: {
      type: String,
      select: false, // 🔐 hide refresh token
    },
  },
  { timestamps: true }
);

// ================= HASH PASSWORD =================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// ================= COMPARE PASSWORD =================
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ================= SAFE JSON =================
userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.refreshToken;

  return obj;
};

// ================= EXPORT =================
const User = mongoose.model("User", userSchema);

export default User;