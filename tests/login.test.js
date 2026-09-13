 // login.test.js
import request from "supertest";
import { describe, test, expect } from "vitest";
import app from "../app.js";
import { makeUser } from "./helpers.js";

describe("login", () => {
  test("unknown email and wrong password give identical responses", async () => {
    await makeUser({ email: "real@example.com", password: "correct-password" });

    const unknown = await request(app)
      .post("/api/login")
      .send({ email: "nobody@example.com", password: "correct-password" });

    const wrongPassword = await request(app)
      .post("/api/login")
      .send({ email: "real@example.com", password: "wrong-password" });

    // If these differ, the endpoint reveals which emails are registered.
    expect(unknown.status).toBe(wrongPassword.status);
    expect(unknown.body.message).toBe(wrongPassword.body.message);
  });

  test("an operator object in the email field does not authenticate", async () => {
    await makeUser({ email: "real2@example.com" });

    const res = await request(app)
      .post("/api/login")
      .send({ email: { $ne: null }, password: "anything" });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  test("an unverified user cannot log in", async () => {
    await makeUser({ email: "unverified@example.com", password: "password123", isVerified: false });

    const res = await request(app)
      .post("/api/login")
      .send({ email: "unverified@example.com", password: "password123" });

    expect(res.status).toBe(403);
    expect(res.body.needsVerification).toBe(true);
  });

  test("a verified user logs in and no secrets are returned", async () => {
    await makeUser({ email: "good@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/login")
      .send({ email: "good@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.otpChallenge).toBeUndefined();
    expect(res.body.user.resetPasswordToken).toBeUndefined();
  });

  test("email lookup is case-insensitive", async () => {
    await makeUser({ email: "mixed@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/login")
      .send({ email: "Mixed@Example.com", password: "password123" });

    expect(res.status).toBe(200);
  });
});
