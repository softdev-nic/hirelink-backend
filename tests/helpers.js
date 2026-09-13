 import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../Model/Users.js";

export const makeUser = async (overrides = {}) => {
  return User.create({
    name: overrides.name || "Test User",
    email: overrides.email || `user${Date.now()}${Math.random()}@example.com`,
    password: await bcrypt.hash(overrides.password || "password123", 10),
    role: overrides.role || "user",
    isVerified: overrides.isVerified !== undefined ? overrides.isVerified : true,
    isModerator: overrides.role === "moderator",
  });
};

export const tokenFor = (user) =>
  jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });

export const makeUserWithToken = async (overrides = {}) => {
  const user = await makeUser(overrides);
  return { user, token: tokenFor(user) };
};