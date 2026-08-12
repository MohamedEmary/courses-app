import { describe, expect, it } from "vitest";
import { LoginSchema, RegisterSchema } from "@/schemas/auth.schema.ts";

const validRegister = {
  name: "Alice Smith",
  email: "alice@example.com",
  password: "password123",
};

describe("RegisterSchema", () => {
  it("accepts a valid registration payload", () => {
    expect(RegisterSchema.safeParse(validRegister).success).toBe(true);
  });

  it("accepts names with unicode letters and apostrophes", () => {
    expect(
      RegisterSchema.safeParse({
        ...validRegister,
        name: "José María O'Brien",
      }).success,
    ).toBe(true);
    expect(
      RegisterSchema.safeParse({ ...validRegister, name: "علي" }).success,
    ).toBe(true);
  });

  it("rejects names shorter than 2 characters", () => {
    expect(
      RegisterSchema.safeParse({ ...validRegister, name: "A" }).success,
    ).toBe(false);
  });

  it("rejects names longer than 100 characters", () => {
    expect(
      RegisterSchema.safeParse({
        ...validRegister,
        name: "A".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("rejects names with special characters", () => {
    for (const name of ["John123", "john@smith", "alice_doe", "a!b"]) {
      expect(RegisterSchema.safeParse({ ...validRegister, name }).success).toBe(
        false,
      );
    }
  });

  it("rejects an invalid email", () => {
    for (const email of ["not-an-email", "a@b", "@example.com", "a@.com"]) {
      expect(
        RegisterSchema.safeParse({ ...validRegister, email }).success,
      ).toBe(false);
    }
  });

  it("trims and lowercases the email", () => {
    const result = RegisterSchema.safeParse({
      ...validRegister,
      email: "  ALICE@Example.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("alice@example.com");
    }
  });

  it("rejects a password shorter than 6 characters", () => {
    expect(
      RegisterSchema.safeParse({ ...validRegister, password: "12345" }).success,
    ).toBe(false);
  });

  it("rejects a password longer than 100 characters", () => {
    expect(
      RegisterSchema.safeParse({
        ...validRegister,
        password: "a".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("rejects a payload missing required fields", () => {
    for (const body of [
      { email: "a@b.com", password: "password" },
      { name: "Alice", password: "password" },
      { name: "Alice", email: "a@b.com" },
    ]) {
      expect(RegisterSchema.safeParse(body).success).toBe(false);
    }
  });
});

describe("LoginSchema", () => {
  it("accepts a valid login payload", () => {
    const result = LoginSchema.safeParse({
      email: "alice@example.com",
      password: "password",
    });
    expect(result.success).toBe(true);
  });

  it("trims and lowercases the email", () => {
    const result = LoginSchema.safeParse({
      email: "  BOB@Example.COM  ",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("bob@example.com");
    }
  });

  it("rejects an invalid email", () => {
    expect(
      LoginSchema.safeParse({ email: "nope", password: "password" }).success,
    ).toBe(false);
  });

  it("rejects a missing password", () => {
    expect(LoginSchema.safeParse({ email: "alice@example.com" }).success).toBe(
      false,
    );
  });
});
