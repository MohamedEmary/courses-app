import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { toSafeUser, UserModel } from "@/models/user.model.ts";
import { USER_ROLES } from "@/utils/constants.ts";

const validUser = {
  name: "Alice",
  email: "alice@example.com",
  password: "hashed-password",
};

describe("UserModel", () => {
  it("accepts a valid user", async () => {
    const doc = new UserModel(validUser);
    await doc.validate();
  });

  it("defaults the role to user", () => {
    const doc = new UserModel(validUser);
    expect(doc.role).toBe(USER_ROLES.USER);
  });

  it("defaults the avatar to avatar.png", () => {
    const doc = new UserModel(validUser);
    expect(doc.avatar).toBe("avatar.png");
  });

  it("rejects an unknown role", async () => {
    const doc = new UserModel({ ...validUser, role: "superuser" });
    await expect(doc.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ role: expect.anything() }),
    });
  });

  it("lowercases and trims the email", () => {
    const doc = new UserModel({
      ...validUser,
      email: "  ALICE@Example.COM  ",
    });
    expect(doc.email).toBe("alice@example.com");
  });

  it("requires name, email, and password", async () => {
    const doc = new UserModel({});
    await expect(doc.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({
        name: expect.anything(),
        email: expect.anything(),
        password: expect.anything(),
      }),
    });
  });
});

describe("toSafeUser", () => {
  const makeDoc = () => {
    const doc = new UserModel({
      name: "Alice",
      email: "alice@example.com",
      role: "user",
      avatar: "avatar.png",
      password: "$argon2id$HASHED_SECRET_THAT_MUST_NEVER_LEAK",
    });
    doc._id = new Types.ObjectId("507f1f77bcf86cd799439011");
    return doc;
  };

  it("returns only the public fields with an avatar URL", () => {
    const result = toSafeUser(makeDoc());
    expect(result.id.toString()).toBe("507f1f77bcf86cd799439011");
    expect(result).toMatchObject({
      name: "Alice",
      email: "alice@example.com",
      role: "user",
      avatar: "/uploads/avatar.png",
    });
  });

  it("never leaks the password hash", () => {
    const result = toSafeUser(makeDoc());
    expect(result).not.toHaveProperty("password");
    expect(JSON.stringify(result)).not.toContain("HASHED_SECRET");
  });

  it("uses the default avatar when the user has none", () => {
    const doc = new UserModel({
      name: "Bob",
      email: "bob@example.com",
      role: "user",
      password: "hash",
    });
    doc._id = new Types.ObjectId("507f1f77bcf86cd799439011");
    expect(toSafeUser(doc).avatar).toBe("/uploads/avatar.png");
  });
});
