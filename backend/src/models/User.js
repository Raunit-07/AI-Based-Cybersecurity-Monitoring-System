import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // 🔒 basic security
    },
    role: {
      type: String,
      default: "user",
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);


// ✅ MODERN PRE-SAVE HOOK (ASYNC/AWAIT)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});


// ✅ PASSWORD CHECK (SAFE)
userSchema.methods.comparePassword = async function (password) {
  if (!password) return false;
  return bcrypt.compare(password, this.password);
};


const User = mongoose.model("User", userSchema);

export default User;