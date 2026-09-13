 // otp.test.js
import request from "supertest";
import { describe, test, expect } from "vitest";
import app from "../app.js";
import User from "../Model/Users.js";

const register = (overrides = {}) =>
  request(app).post("/api/register").send({
    name: overrides.name || "New User",
    email: overrides.email || "new@example.com",
    password: overrides.password || "password123",
  });

describe("registration", () => {
  test("returns a challengeId and no user object", async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.challengeId).toBeTruthy();
    // The document holds the OTP and the password hash at this point.
    expect(res.body.user).toBeUndefined();
  });

  test("stores the email lowercased", async () => {
    await register({ email: "MiXeD@Example.COM" });

    const user = await User.findOne({ email: "mixed@example.com" });
    expect(user).not.toBeNull();
  });

  test("rejects a password under 8 characters", async () => {
    const res = await register({ password: "short" });
    expect(res.status).toBe(400);
  });

  test("a new account starts unverified", async () => {
    await register({ email: "fresh@example.com" });

    const user = await User.findOne({ email: "fresh@example.com" });
    expect(user.isVerified).toBe(false);
  });
});

describe("otp verification", () => {
  test("the correct code verifies the account", async () => {
    const res = await register({ email: "otp1@example.com" });
    const user = await User.findOne({ email: "otp1@example.com" });

    const verify = await request(app)
      .post("/api/otp/verify")
      .send({ challengeId: res.body.challengeId, otp: user.otpChallenge.otp });

    expect(verify.status).toBe(200);
    expect((await User.findById(user._id)).isVerified).toBe(true);
  });

  test("five wrong attempts destroys the challenge", async () => {
    const res = await register({ email: "otp2@example.com" });
    const user = await User.findOne({ email: "otp2@example.com" });
    const realOtp = user.otpChallenge.otp;
    const wrongOtp = realOtp === "111111" ? "222222" : "111111";

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/otp/verify")
        .send({ challengeId: res.body.challengeId, otp: wrongOtp });
    }

    // Even the correct code should now fail.
    const afterBurn = await request(app)
      .post("/api/otp/verify")
      .send({ challengeId: res.body.challengeId, otp: realOtp });

    expect(afterBurn.status).toBe(400);
    expect((await User.findById(user._id)).isVerified).toBe(false);
  });

  test("an expired code is rejected", async () => {
    const res = await register({ email: "otp3@example.com" });
    const user = await User.findOne({ email: "otp3@example.com" });

    user.otpChallenge.otpExpiresAt = new Date(Date.now() - 1000);
    await user.save();

    const verify = await request(app)
      .post("/api/otp/verify")
      .send({ challengeId: res.body.challengeId, otp: user.otpChallenge.otp });

    expect(verify.status).toBe(400);
  });

  test("resend gives the same response for a real and an unknown email", async () => {
    await register({ email: "known@example.com" });

    const known = await request(app).post("/api/otp/resend").send({ email: "known@example.com" });
    const unknown = await request(app).post("/api/otp/resend").send({ email: "nobody@example.com" });

    expect(known.status).toBe(unknown.status);
    expect(known.body.message).toBe(unknown.body.message);
  });
});
