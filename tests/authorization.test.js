 // authorization.test.js
import request from "supertest";
import { describe, test, expect } from "vitest";
import app from "../app.js";
import User from "../Model/Users.js";
import { makeUserWithToken, makeUser } from "./helpers.js";

describe("privilege escalation", () => {
  test("a normal user cannot assign a moderator", async () => {
    const { token } = await makeUserWithToken();
    const victim = await makeUser({ email: "victim@example.com" });

    const res = await request(app)
      .post("/api/assign-moderator")
      .set("Authorization", token)
      .send({ email: victim.email });

    expect(res.status).toBe(403);

    const unchanged = await User.findById(victim._id);
    expect(unchanged.role).toBe("user");
  });

  test("a moderator cannot assign another moderator", async () => {
    const { token } = await makeUserWithToken({ role: "moderator" });
    const victim = await makeUser({ email: "victim2@example.com" });

    const res = await request(app)
      .post("/api/assign-moderator")
      .set("Authorization", token)
      .send({ email: victim.email });

    expect(res.status).toBe(403);
  });

  test("a super admin can assign a moderator", async () => {
    const { token } = await makeUserWithToken({ role: "superAdmin" });
    const target = await makeUser({ email: "target@example.com" });

    const res = await request(app)
      .post("/api/assign-moderator")
      .set("Authorization", token)
      .send({ email: target.email });

    expect(res.status).toBe(200);

    const promoted = await User.findById(target._id);
    expect(promoted.role).toBe("moderator");
  });

  test("a super admin's role cannot be overwritten", async () => {
    const { token } = await makeUserWithToken({ role: "superAdmin", email: "admin1@example.com" });
    const otherAdmin = await makeUser({ role: "superAdmin", email: "admin2@example.com" });

    const res = await request(app)
      .post("/api/assign-moderator")
      .set("Authorization", token)
      .send({ email: otherAdmin.email });

    expect(res.status).toBe(403);

    const unchanged = await User.findById(otherAdmin._id);
    expect(unchanged.role).toBe("superAdmin");
  });

  test("a normal user cannot unban", async () => {
    const { token } = await makeUserWithToken();

    const res = await request(app)
      .post("/api/unban-user")
      .set("Authorization", token)
      .send({ email: "someone@example.com" });

    expect(res.status).toBe(403);
  });
});

describe("token handling", () => {
  test("a deleted user's token stops working", async () => {
    const { user, token } = await makeUserWithToken();
    await User.findByIdAndDelete(user._id);

    const res = await request(app).get("/api/role").set("Authorization", token);

    expect(res.status).toBe(401);
  });

  test("a token issued before a password change is rejected", async () => {
    const { user, token } = await makeUserWithToken();

    // Simulate a reset happening after the token was issued.
    user.passwordChangedAt = new Date(Date.now() + 5000);
    await user.save();

    const res = await request(app).get("/api/role").set("Authorization", token);

    expect(res.status).toBe(401);
  });

  test("a request with no token is rejected", async () => {
    const res = await request(app).get("/api/role");
    expect(res.status).toBe(401);
  });
});
