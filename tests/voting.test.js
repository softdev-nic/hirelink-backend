 // voting.test.js
import request from "supertest";
import { describe, test, expect } from "vitest";
import app from "../app.js";
import Mail from "../Model/LinkSchema.js";
import { makeUserWithToken } from "./helpers.js";

const makeMail = async (postedBy, overrides = {}) =>
  Mail.create({
    companyName: overrides.companyName || `Company ${Math.random()}`,
    email: overrides.email || `hr${Math.random()}@example.com`,
    postedBy,
    status: overrides.status || "approved",
  });

describe("voting", () => {
  test("a second upvote is rejected and the count stays at one", async () => {
    const { user, token } = await makeUserWithToken();
    const mail = await makeMail(user._id);

    const first = await request(app)
      .post(`/api/upvote-company-mail/${mail._id}`)
      .set("Authorization", token);
    expect(first.status).toBe(200);
    expect(first.body.upvote).toBe(1);

    const second = await request(app)
      .post(`/api/upvote-company-mail/${mail._id}`)
      .set("Authorization", token);
    expect(second.status).toBe(400);

    const stored = await Mail.findById(mail._id);
    expect(stored.upvote).toBe(1);
  });

  test("switching from upvote to downvote moves the count", async () => {
    const { user, token } = await makeUserWithToken();
    const mail = await makeMail(user._id);

    await request(app).post(`/api/upvote-company-mail/${mail._id}`).set("Authorization", token);
    await request(app).post(`/api/downvote-company-mail/${mail._id}`).set("Authorization", token);

    const stored = await Mail.findById(mail._id);
    expect(stored.upvote).toBe(0);
    expect(stored.downvote).toBe(1);
  });

  test("different users can each vote once", async () => {
    const a = await makeUserWithToken({ email: "a@example.com" });
    const b = await makeUserWithToken({ email: "b@example.com" });
    const mail = await makeMail(a.user._id);

    await request(app).post(`/api/upvote-company-mail/${mail._id}`).set("Authorization", a.token);
    await request(app).post(`/api/upvote-company-mail/${mail._id}`).set("Authorization", b.token);

    const stored = await Mail.findById(mail._id);
    expect(stored.upvote).toBe(2);
  });
});

describe("reporting", () => {
  test("the report count is saved and capped at one per user", async () => {
    const { user, token } = await makeUserWithToken();
    const mail = await makeMail(user._id);

    const first = await request(app)
      .post(`/api/report-mail/${mail._id}`)
      .set("Authorization", token);
    expect(first.status).toBe(200);
    expect(first.body.reports).toBe(1);

    const second = await request(app)
      .post(`/api/report-mail/${mail._id}`)
      .set("Authorization", token);
    expect(second.status).toBe(400);

    // Regression test: `reports` was missing from the schema, so this silently stayed 0.
    const stored = await Mail.findById(mail._id);
    expect(stored.reports).toBe(1);
  });
});

describe("deletion", () => {
  test("the creator can delete their own mail", async () => {
    const { user, token } = await makeUserWithToken();
    const mail = await makeMail(user._id);

    const res = await request(app)
      .delete(`/api/delete-company-mail/${mail._id}`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(await Mail.findById(mail._id)).toBeNull();
  });

  test("a moderator can delete someone else's mail", async () => {
    const owner = await makeUserWithToken({ email: "owner@example.com" });
    const mod = await makeUserWithToken({ email: "mod@example.com", role: "moderator" });
    const mail = await makeMail(owner.user._id);

    const res = await request(app)
      .delete(`/api/delete-company-mail/${mail._id}`)
      .set("Authorization", mod.token);

    expect(res.status).toBe(200);
  });

  test("a stranger cannot delete someone else's mail", async () => {
    const owner = await makeUserWithToken({ email: "owner2@example.com" });
    const stranger = await makeUserWithToken({ email: "stranger@example.com" });
    const mail = await makeMail(owner.user._id);

    const res = await request(app)
      .delete(`/api/delete-company-mail/${mail._id}`)
      .set("Authorization", stranger.token);

    expect(res.status).toBe(403);
    expect(await Mail.findById(mail._id)).not.toBeNull();
  });
});
