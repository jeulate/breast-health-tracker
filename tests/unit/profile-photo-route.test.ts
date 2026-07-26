import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  service: {
    download: vi.fn(),
    replace: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/features/profile-photo/profile-photo.service", () => ({
  ProfilePhotoService: vi.fn(() => mocks.service),
}));

import { DELETE, GET, POST } from "@/app/api/profile/photo/route";

const session = {
  sub: "user-1",
  email: "admin@example.com",
  role: "ADMIN",
};

function createUploadRequest(
  photo = new Blob(["photo"], {
    type: "image/jpeg",
  }),
): Request {
  const formData = new FormData();
  formData.set("photo", photo);

  return new Request("http://localhost/api/profile/photo", {
    method: "POST",
    body: formData,
  });
}

describe("profile photo route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(session);
    mocks.service.download.mockResolvedValue(null);
    mocks.service.replace.mockResolvedValue({
      pathname: "profile-photos/users/user-1/private.jpg",
      previousPhotoCleanupFailed: false,
    });
    mocks.service.remove.mockResolvedValue({
      pathname: null,
      previousPhotoCleanupFailed: false,
    });
  });

  it("rejects every operation without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const responses = await Promise.all([GET(), POST(createUploadRequest()), DELETE()]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401]);

    expect(mocks.service.download).not.toHaveBeenCalled();
    expect(mocks.service.replace).not.toHaveBeenCalled();
    expect(mocks.service.remove).not.toHaveBeenCalled();
  });

  it("downloads the authenticated user photo", async () => {
    mocks.service.download.mockResolvedValue({
      body: new Blob(["photo"], {
        type: "image/jpeg",
      }).stream(),
      contentType: "image/jpeg",
      size: 5,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(await response.text()).toBe("photo");
    expect(mocks.service.download).toHaveBeenCalledWith("users", session.sub);
  });

  it("returns 404 when the user has no photo", async () => {
    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "PHOTO_NOT_FOUND",
        message: "El usuario no tiene una fotografía de perfil.",
      },
    });
  });

  it("replaces the authenticated user photo", async () => {
    const response = await POST(createUploadRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.service.replace).toHaveBeenCalledWith(
      "users",
      session.sub,
      expect.objectContaining({
        contentType: "image/jpeg",
        size: 5,
      }),
    );
    expect(body).toEqual({
      success: true,
      data: {
        hasPhoto: true,
        previousPhotoCleanupFailed: false,
      },
    });
    expect(JSON.stringify(body)).not.toContain("profile-photos/");
  });

  it("rejects an invalid upload", async () => {
    const response = await POST(
      new Request("http://localhost/api/profile/photo", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.service.replace).not.toHaveBeenCalled();
  });

  it("removes the authenticated user photo", async () => {
    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(mocks.service.remove).toHaveBeenCalledWith("users", session.sub);
    expect(await response.json()).toEqual({
      success: true,
      data: {
        hasPhoto: false,
        previousPhotoCleanupFailed: false,
      },
    });
  });

  it("hides unexpected internal errors", async () => {
    mocks.service.download.mockRejectedValue(new Error("Redis credentials"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "No fue posible procesar la fotografía.",
    });
    expect(JSON.stringify(body)).not.toContain("Redis credentials");
  });
});
