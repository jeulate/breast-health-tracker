import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings } from "@/features/admin-settings";
import type { PublicUser } from "@/types";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  authorize: mocks.authorize,
}));

vi.mock("@/services/admin-settings.service", () => ({
  adminSettingsService: {
    getSettings: mocks.getSettings,
    updateSettings: mocks.updateSettings,
  },
}));

import { GET, PUT } from "@/app/api/admin/settings/route";

const administrator: PublicUser = {
  id: "admin-1",
  name: "Administrador",
  email: "admin@example.com",
  role: "ADMIN",
  status: "ACTIVE",
  createdAt: "2026-07-27T12:00:00.000Z",
  updatedAt: "2026-07-27T12:00:00.000Z",
};

const settings: AppSettings = {
  appName: "BI-RADS Tracker",
  defaultTimezone: "America/La_Paz",
  userProfilePhotosEnabled: true,
  patientProfilePhotosEnabled: true,
  profilePhotoMaxSizeMb: 5,
  createdAt: "2026-07-28T12:00:00.000Z",
  updatedAt: "2026-07-28T12:00:00.000Z",
  updatedBy: null,
};

const validInput = {
  appName: "Seguimiento BI-RADS",
  defaultTimezone: "America/La_Paz",
  userProfilePhotosEnabled: false,
  patientProfilePhotosEnabled: true,
  profilePhotoMaxSizeMb: 8,
};

function authorized() {
  return {
    authorized: true as const,
    user: administrator,
  };
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function malformedJsonRequest(): Request {
  return new Request("http://localhost/api/admin/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{invalid-json",
  });
}

async function responseBody(response: Response) {
  return response.json();
}

describe("admin settings API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorize.mockResolvedValue(authorized());
  });

  describe("GET /api/admin/settings", () => {
    it("returns 401 when there is no authenticated session", async () => {
      mocks.authorize.mockResolvedValue({
        authorized: false,
        reason: "UNAUTHORIZED",
      });

      const response = await GET();
      const body = await responseBody(response);

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(mocks.getSettings).not.toHaveBeenCalled();
    });

    it("returns 403 when the user lacks settings:manage", async () => {
      mocks.authorize.mockResolvedValue({
        authorized: false,
        reason: "FORBIDDEN",
      });

      const response = await GET();
      const body = await responseBody(response);

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN");
      expect(mocks.getSettings).not.toHaveBeenCalled();
    });

    it("returns the current application settings", async () => {
      mocks.getSettings.mockResolvedValue(settings);

      const response = await GET();
      const body = await responseBody(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(settings);
      expect(mocks.authorize).toHaveBeenCalledWith("settings:manage");
      expect(mocks.getSettings).toHaveBeenCalledOnce();
    });

    it("returns 500 when retrieving settings fails", async () => {
      mocks.getSettings.mockRejectedValue(new Error("Redis unavailable"));

      const response = await GET();
      const body = await responseBody(response);

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("ADMIN_SETTINGS_FETCH_FAILED");
    });
  });

  describe("PUT /api/admin/settings", () => {
    it("returns 401 before processing the request body", async () => {
      mocks.authorize.mockResolvedValue({
        authorized: false,
        reason: "UNAUTHORIZED",
      });

      const response = await PUT(jsonRequest(validInput));
      const body = await responseBody(response);

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(mocks.updateSettings).not.toHaveBeenCalled();
    });

    it("returns 403 when the user lacks settings:manage", async () => {
      mocks.authorize.mockResolvedValue({
        authorized: false,
        reason: "FORBIDDEN",
      });

      const response = await PUT(jsonRequest(validInput));
      const body = await responseBody(response);

      expect(response.status).toBe(403);
      expect(body.error.code).toBe("FORBIDDEN");
      expect(mocks.updateSettings).not.toHaveBeenCalled();
    });

    it("updates valid settings using the authenticated administrator ID", async () => {
      const updatedSettings: AppSettings = {
        ...settings,
        ...validInput,
        updatedAt: "2026-07-28T13:00:00.000Z",
        updatedBy: administrator.id,
      };

      mocks.updateSettings.mockResolvedValue(updatedSettings);

      const response = await PUT(jsonRequest(validInput));
      const body = await responseBody(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(updatedSettings);
      expect(mocks.authorize).toHaveBeenCalledWith("settings:manage");
      expect(mocks.updateSettings).toHaveBeenCalledWith(validInput, administrator.id);
    });

    it("returns 400 for malformed JSON", async () => {
      const response = await PUT(malformedJsonRequest());
      const body = await responseBody(response);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_JSON");
      expect(mocks.updateSettings).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid settings", async () => {
      const response = await PUT(
        jsonRequest({
          ...validInput,
          defaultTimezone: "Bolivia/Santa_Cruz",
          profilePhotoMaxSizeMb: 20,
        }),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.updateSettings).not.toHaveBeenCalled();
    });

    it("returns 400 when an audit field is supplied", async () => {
      const response = await PUT(
        jsonRequest({
          ...validInput,
          updatedBy: "forged-admin-id",
        }),
      );
      const body = await responseBody(response);

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mocks.updateSettings).not.toHaveBeenCalled();
    });

    it("returns 500 when updating settings fails", async () => {
      mocks.updateSettings.mockRejectedValue(new Error("Redis unavailable"));

      const response = await PUT(jsonRequest(validInput));
      const body = await responseBody(response);

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("ADMIN_SETTINGS_UPDATE_FAILED");
    });
  });
});
