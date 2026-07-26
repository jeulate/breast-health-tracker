import { describe, expect, it } from "vitest";

import {
  parseProfilePhotoUpload,
  toProfilePhotoDownloadResponse,
  toProfilePhotoErrorResponse,
  toProfilePhotoMutationData,
} from "@/features/profile-photo/api/profile-photo-api";
import { ProfilePhotoError } from "@/features/profile-photo/profile-photo.errors";

function createUploadRequest(
  value?: Blob | string,
): Request {
  const formData = new FormData();

  if (value !== undefined) {
    formData.set("photo", value);
  }

  return new Request("http://localhost/api/profile/photo", {
    method: "POST",
    body: formData,
  });
}

describe("profile photo API helpers", () => {
  it("parses and validates the photo field", async () => {
    const result = await parseProfilePhotoUpload(
      createUploadRequest(
        new Blob(["photo"], { type: "image/jpeg" }),
      ),
    );

    expect(result.contentType).toBe("image/jpeg");
    expect(result.size).toBe(5);
    expect(result.body).toBeInstanceOf(Blob);
  });

  it("rejects a missing photo field", async () => {
    await expect(
      parseProfilePhotoUpload(createUploadRequest()),
    ).rejects.toMatchObject({
      code: "EMPTY_FILE",
    });
  });

  it("rejects a textual photo field", async () => {
    await expect(
      parseProfilePhotoUpload(
        createUploadRequest("not-a-file"),
      ),
    ).rejects.toMatchObject({
      code: "EMPTY_FILE",
    });
  });

  it.each([
    ["EMPTY_FILE", 400],
    ["FILE_TOO_LARGE", 400],
    ["UNSUPPORTED_FILE_TYPE", 400],
    ["INVALID_OWNER_ID", 400],
    ["OWNER_NOT_FOUND", 404],
    ["BLOB_CONFIGURATION_ERROR", 500],
    ["STORAGE_ERROR", 500],
  ] as const)(
    "maps %s to HTTP %s",
    async (code, expectedStatus) => {
      const response = toProfilePhotoErrorResponse(
        new ProfilePhotoError(code, "Photo error"),
      );

      expect(response.status).toBe(expectedStatus);
      expect(await response.json()).toEqual({
        success: false,
        error: {
          code,
          message: "Photo error",
        },
      });
    },
  );

  it("hides unexpected internal errors", async () => {
    const response = toProfilePhotoErrorResponse(
      new Error("Redis credentials"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "No fue posible procesar la fotografía.",
      },
    });
  });

  it("creates a private binary response", async () => {
    const response = toProfilePhotoDownloadResponse({
      body: new Blob(["photo"], {
        type: "image/jpeg",
      }).stream(),
      contentType: "image/jpeg",
      size: 5,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "image/jpeg",
    );
    expect(response.headers.get("content-length")).toBe("5");
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store",
    );
    expect(
      response.headers.get("x-content-type-options"),
    ).toBe("nosniff");
    expect(await response.text()).toBe("photo");
  });

  it("does not expose the private Blob pathname", () => {
    expect(
      toProfilePhotoMutationData({
        pathname:
          "profile-photos/users/user-1/private.jpg",
        previousPhotoCleanupFailed: false,
      }),
    ).toEqual({
      hasPhoto: true,
      previousPhotoCleanupFailed: false,
    });
  });
});