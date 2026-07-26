import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

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

vi.mock(
  "@/features/profile-photo/profile-photo.service",
  () => ({
    ProfilePhotoService: vi.fn(() => mocks.service),
  }),
);

import {
  DELETE,
  GET,
  POST,
} from "@/app/api/patients/[id]/photo/route";

const patientId =
  "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";

const session = {
  sub: "user-1",
  email: "admin@example.com",
  role: "ADMIN",
};

function routeParams() {
  return {
    params: Promise.resolve({ id: patientId }),
  };
}

function createRequest(
  method: "GET" | "DELETE",
): Request {
  return new Request(
    `http://localhost/api/patients/${patientId}/photo`,
    { method },
  );
}

function createUploadRequest(
  photo = new Blob(["photo"], {
    type: "image/jpeg",
  }),
): Request {
  const formData = new FormData();
  formData.set("photo", photo);

  return new Request(
    `http://localhost/api/patients/${patientId}/photo`,
    {
      method: "POST",
      body: formData,
    },
  );
}

describe("patient profile photo route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(session);
    mocks.service.download.mockResolvedValue(null);
    mocks.service.replace.mockResolvedValue({
      pathname:
        `profile-photos/patients/${patientId}/private.jpg`,
      previousPhotoCleanupFailed: false,
    });
    mocks.service.remove.mockResolvedValue({
      pathname: null,
      previousPhotoCleanupFailed: false,
    });
  });

  it("rejects every operation without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const responses = await Promise.all([
      GET(createRequest("GET"), routeParams()),
      POST(createUploadRequest(), routeParams()),
      DELETE(createRequest("DELETE"), routeParams()),
    ]);

    expect(
      responses.map((response) => response.status),
    ).toEqual([401, 401, 401]);

    expect(mocks.service.download).not.toHaveBeenCalled();
    expect(mocks.service.replace).not.toHaveBeenCalled();
    expect(mocks.service.remove).not.toHaveBeenCalled();
  });

  it("downloads the patient photo", async () => {
    mocks.service.download.mockResolvedValue({
      body: new Blob(["photo"], {
        type: "image/jpeg",
      }).stream(),
      contentType: "image/jpeg",
      size: 5,
    });

    const response = await GET(
      createRequest("GET"),
      routeParams(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "image/jpeg",
    );
    expect(await response.text()).toBe("photo");
    expect(mocks.service.download).toHaveBeenCalledWith(
      "patients",
      patientId,
    );
  });

  it("returns 404 when the patient has no photo", async () => {
    const response = await GET(
      createRequest("GET"),
      routeParams(),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "PHOTO_NOT_FOUND",
        message:
          "La paciente no tiene una fotografía de perfil.",
      },
    });
  });

  it("replaces the patient photo", async () => {
    const response = await POST(
      createUploadRequest(),
      routeParams(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.service.replace).toHaveBeenCalledWith(
      "patients",
      patientId,
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
    expect(JSON.stringify(body)).not.toContain(
      "profile-photos/",
    );
  });

  it("rejects an invalid upload", async () => {
    const response = await POST(
      new Request(
        `http://localhost/api/patients/${patientId}/photo`,
        {
          method: "POST",
          body: new FormData(),
        },
      ),
      routeParams(),
    );

    expect(response.status).toBe(400);
    expect(mocks.service.replace).not.toHaveBeenCalled();
  });

  it("removes the patient photo", async () => {
    const response = await DELETE(
      createRequest("DELETE"),
      routeParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.service.remove).toHaveBeenCalledWith(
      "patients",
      patientId,
    );
    expect(await response.json()).toEqual({
      success: true,
      data: {
        hasPhoto: false,
        previousPhotoCleanupFailed: false,
      },
    });
  });

  it("maps a missing patient to HTTP 404", async () => {
    const { ProfilePhotoError } = await import(
      "@/features/profile-photo/profile-photo.errors"
    );

    mocks.service.download.mockRejectedValue(
      new ProfilePhotoError(
        "OWNER_NOT_FOUND",
        "The profile photo owner does not exist.",
      ),
    );

    const response = await GET(
      createRequest("GET"),
      routeParams(),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "OWNER_NOT_FOUND",
        message:
          "The profile photo owner does not exist.",
      },
    });
  });

  it("hides unexpected internal errors", async () => {
    mocks.service.download.mockRejectedValue(
      new Error("Redis credentials"),
    );

    const response = await GET(
      createRequest("GET"),
      routeParams(),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "INTERNAL_ERROR",
      message:
        "No fue posible procesar la fotografía.",
    });
    expect(JSON.stringify(body)).not.toContain(
      "Redis credentials",
    );
  });
});