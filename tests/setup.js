 import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, afterAll, afterEach, vi } from "vitest";

process.env.JWT_SECRET = "test-secret-not-used-anywhere-real";
process.env.NODE_ENV = "test";

vi.mock("../mailer", () => ({
  default: { sendEmail: vi.fn().mockResolvedValue({ id: "test-email" }) },
  sendEmail: vi.fn().mockResolvedValue({ id: "test-email" }),
}));

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});