import { describe, expect, it } from "vitest";

import { updateAdminSettingsSchema } from "@/lib/validations/admin-settings";

const validSettings = {
  appName: "BI-RADS Tracker",
  defaultTimezone: "America/La_Paz",
  userProfilePhotosEnabled: true,
  patientProfilePhotosEnabled: true,
  profilePhotoMaxSizeMb: 5,
};

describe("updateAdminSettingsSchema", () => {
  it("acepta una configuración completa y válida", () => {
    const result = updateAdminSettingsSchema.safeParse(validSettings);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual(validSettings);
    }
  });

  it("normaliza espacios en el nombre y la zona horaria", () => {
    const result = updateAdminSettingsSchema.safeParse({
      ...validSettings,
      appName: "  Mi aplicación médica  ",
      defaultTimezone: "  America/La_Paz  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.appName).toBe("Mi aplicación médica");
      expect(result.data.defaultTimezone).toBe("America/La_Paz");
    }
  });

  it("rechaza una zona horaria inválida", () => {
    const result = updateAdminSettingsSchema.safeParse({
      ...validSettings,
      defaultTimezone: "Bolivia/Santa_Cruz",
    });

    expect(result.success).toBe(false);
  });

  it.each([0, 11, 1.5])("rechaza un límite de fotografía inválido: %s", (profilePhotoMaxSizeMb) => {
    const result = updateAdminSettingsSchema.safeParse({
      ...validSettings,
      profilePhotoMaxSizeMb,
    });

    expect(result.success).toBe(false);
  });

  it("rechaza campos adicionales", () => {
    const result = updateAdminSettingsSchema.safeParse({
      ...validSettings,
      updatedBy: "usuario-no-permitido",
    });

    expect(result.success).toBe(false);
  });

  it("rechaza configuraciones incompletas", () => {
    const incompleteSettings = {
      defaultTimezone: validSettings.defaultTimezone,
      userProfilePhotosEnabled: validSettings.userProfilePhotosEnabled,
      patientProfilePhotosEnabled: validSettings.patientProfilePhotosEnabled,
      profilePhotoMaxSizeMb: validSettings.profilePhotoMaxSizeMb,
    };

    const result = updateAdminSettingsSchema.safeParse(incompleteSettings);

    expect(result.success).toBe(false);
  });
});
