import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  getBlobEnv: vi.fn(),
  randomUUID: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: mocks.put,
  get: mocks.get,
  del: mocks.del,
}));

vi.mock("@/features/profile-photo/blob-env", () => ({
  getBlobEnv: mocks.getBlobEnv,
}));

import { ProfilePhotoError } from "@/features/profile-photo/profile-photo.errors";
import { VercelBlobProfilePhotoStorage } from "@/features/profile-photo/vercel-blob-profile-photo-storage";

describe("VercelBlobProfilePhotoStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getBlobEnv.mockReturnValue({
      BLOB_READ_WRITE_TOKEN: "test-blob-token",
    });

    mocks.randomUUID.mockReturnValue(
      "11111111-2222-4333-8444-555555555555",
    );

    vi.stubGlobal("crypto", {
      randomUUID: mocks.randomUUID,
    });
  });

  it("uploads a private profile photo", async () => {
    const body = new Blob(["photo"], { type: "image/jpeg" });

    mocks.put.mockResolvedValue({
      pathname:
        "profile-photos/patients/patient-1/11111111-2222-4333-8444-555555555555.jpg",
    });

    const storage = new VercelBlobProfilePhotoStorage();

    const result = await storage.upload("patients", "patient-1", {
      body,
      contentType: "image/jpeg",
      size: body.size,
    });

    expect(mocks.put).toHaveBeenCalledWith(
      "profile-photos/patients/patient-1/11111111-2222-4333-8444-555555555555.jpg",
      body,
      {
        access: "private",
        token: "test-blob-token",
        contentType: "image/jpeg",
        maximumSizeInBytes: body.size,
      },
    );

    expect(result).toEqual({
      pathname:
        "profile-photos/patients/patient-1/11111111-2222-4333-8444-555555555555.jpg",
      contentType: "image/jpeg",
      size: body.size,
    });
  });

  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ] as const)(
    "uses the correct extension for %s",
    async (contentType, extension) => {
      const body = new Blob(["photo"], { type: contentType });
      const pathname =
        `profile-photos/users/user-1/` +
        `11111111-2222-4333-8444-555555555555.${extension}`;

      mocks.put.mockResolvedValue({ pathname });

      const storage = new VercelBlobProfilePhotoStorage();

      await storage.upload("users", "user-1", {
        body,
        contentType,
        size: body.size,
      });

      expect(mocks.put).toHaveBeenCalledWith(
        pathname,
        body,
        expect.objectContaining({
          access: "private",
          contentType,
        }),
      );
    },
  );

  it.each([
    "",
    "owner with spaces",
    "../patient",
    "patient/photo",
    "a".repeat(129),
  ])("rejects the invalid owner ID %j", async (ownerId) => {
    const storage = new VercelBlobProfilePhotoStorage();

    await expect(
      storage.upload("patients", ownerId, {
        body: new Blob(["photo"]),
        contentType: "image/jpeg",
        size: 5,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_OWNER_ID",
    });

    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("downloads a private profile photo", async () => {
    const stream = new ReadableStream<Uint8Array>();

    mocks.get.mockResolvedValue({
    statusCode: 200,
    stream,
    headers: new Headers(),
    blob: {
        url: "https://example.public.blob.vercel-storage.com/photo.webp",
        downloadUrl:
        "https://example.public.blob.vercel-storage.com/photo.webp?download=1",
        pathname: "profile-photos/patients/patient-1/photo.webp",
        contentType: "image/webp",
        contentDisposition: 'inline; filename="photo.webp"',
        size: 2048,
        uploadedAt: new Date("2026-07-24T00:00:00.000Z"),
        etag: '"test-etag"',
        cacheControl: "public, max-age=0",
    },
    });

    const storage = new VercelBlobProfilePhotoStorage();

    const result = await storage.download(
      "profile-photos/patients/patient-1/photo.webp",
    );

    expect(mocks.get).toHaveBeenCalledWith(
      "profile-photos/patients/patient-1/photo.webp",
      {
        access: "private",
        token: "test-blob-token",
      },
    );

    expect(result).toEqual({
      body: stream,
      contentType: "image/webp",
      size: 2048,
    });
  });

it("returns null when the response has no readable stream", async () => {
    mocks.get.mockResolvedValue({
        statusCode: 304,
        stream: null,
        headers: new Headers(),
        blob: {
        contentType: "image/webp",
        size: 2048,
        },
    });

    const storage = new VercelBlobProfilePhotoStorage();

    await expect(
        storage.download(
        "profile-photos/patients/patient-1/photo.webp",
        ),
    ).resolves.toBeNull();
});

  it("returns null when the profile photo does not exist", async () => {
    mocks.get.mockResolvedValue(null);

    const storage = new VercelBlobProfilePhotoStorage();

    await expect(
      storage.download(
        "profile-photos/patients/patient-1/missing.webp",
      ),
    ).resolves.toBeNull();
  });

  it("removes a profile photo", async () => {
    mocks.del.mockResolvedValue(undefined);

    const storage = new VercelBlobProfilePhotoStorage();

    await storage.remove(
      "profile-photos/patients/patient-1/photo.webp",
    );

    expect(mocks.del).toHaveBeenCalledWith(
      "profile-photos/patients/patient-1/photo.webp",
      {
        token: "test-blob-token",
      },
    );
  });

  it("converts SDK upload failures into storage errors", async () => {
    mocks.put.mockRejectedValue(new Error("Blob service unavailable"));

    const storage = new VercelBlobProfilePhotoStorage();

    await expect(
      storage.upload("patients", "patient-1", {
        body: new Blob(["photo"]),
        contentType: "image/jpeg",
        size: 5,
      }),
    ).rejects.toMatchObject({
      code: "STORAGE_ERROR",
      message: "The profile photo could not be uploaded.",
    });
  });

  it("preserves configuration errors", async () => {
    mocks.getBlobEnv.mockImplementation(() => {
      throw new ProfilePhotoError(
        "BLOB_CONFIGURATION_ERROR",
        "Private profile photo storage is not configured.",
      );
    });

    const storage = new VercelBlobProfilePhotoStorage();

    await expect(
      storage.download("profile-photos/patients/patient-1/photo.jpg"),
    ).rejects.toMatchObject({
      code: "BLOB_CONFIGURATION_ERROR",
    });
  });
});