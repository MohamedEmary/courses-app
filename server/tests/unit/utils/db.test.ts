import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectDB } from "@/utils/db.ts";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  connection: { readyState: 0 },
}));

vi.mock("mongoose", () => ({
  default: {
    connect: mocks.connect,
    connection: mocks.connection,
  },
}));

describe("connectDB", () => {
  const uri = "mongodb://localhost:27017/test";

  beforeEach(() => {
    mocks.connect.mockClear();
    mocks.connection.readyState = 0;
  });

  it("connects when there is no active connection", async () => {
    mocks.connect.mockResolvedValue(undefined);

    const connection = await connectDB(uri);

    expect(mocks.connect).toHaveBeenCalledOnce();
    expect(mocks.connect).toHaveBeenCalledWith(uri);
    expect(connection).toBe(mocks.connection);
  });

  it("reuses the existing connection when already connected", async () => {
    mocks.connection.readyState = 1;

    await connectDB(uri);
    await connectDB(uri);

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("reuses the connection while one is in progress", async () => {
    mocks.connection.readyState = 2;

    await connectDB(uri);

    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("reconnects after the connection has been closed", async () => {
    mocks.connection.readyState = 1;
    await connectDB(uri);
    expect(mocks.connect).not.toHaveBeenCalled();

    mocks.connection.readyState = 0;
    await connectDB(uri);

    expect(mocks.connect).toHaveBeenCalledOnce();
    expect(mocks.connect).toHaveBeenCalledWith(uri);
  });
});
