// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import type { AppSettings } from "@/features/admin-settings";

const { refreshMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const initialSettings: AppSettings = {
  appName: "BI-RADS Tracker",
  defaultTimezone: "America/La_Paz",
  userProfilePhotosEnabled: true,
  patientProfilePhotosEnabled: false,
  profilePhotoMaxSizeMb: 5,
  createdAt: "2026-07-28T12:00:00.000Z",
  updatedAt: "2026-07-28T12:00:00.000Z",
  updatedBy: "admin-1",
};

const updatedSettings: AppSettings = {
  ...initialSettings,
  appName: "Seguimiento BI-RADS",
  userProfilePhotosEnabled: false,
  patientProfilePhotosEnabled: true,
  profilePhotoMaxSizeMb: 8,
  updatedAt: "2026-07-28T13:00:00.000Z",
};

describe("AdminSettingsForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    refreshMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("muestra los valores actuales de la configuración", () => {
    render(<AdminSettingsForm initialSettings={initialSettings} />);

    expect(
      screen.getByRole("textbox", {
        name: "Nombre de la aplicación",
      }),
    ).toHaveValue("BI-RADS Tracker");

    expect(
      screen.getByRole("combobox", {
        name: "Zona horaria predeterminada",
      }),
    ).toHaveValue("America/La_Paz");

    expect(
      screen.getByRole("spinbutton", {
        name: "Tamaño máximo de fotografías",
      }),
    ).toHaveValue(5);

    const switches = screen.getAllByRole("switch");

    expect(switches).toHaveLength(2);
    expect(switches[0]).toBeChecked();
    expect(switches[1]).not.toBeChecked();

    expect(
      screen.getByRole("button", {
        name: "Guardar configuración",
      }),
    ).toBeEnabled();
  });

  it("permite activar y desactivar las fotografías de perfil", async () => {
    const user = userEvent.setup();

    render(<AdminSettingsForm initialSettings={initialSettings} />);

    const [userPhotosSwitch, patientPhotosSwitch] = screen.getAllByRole("switch");

    await user.click(userPhotosSwitch);
    await user.click(patientPhotosSwitch);

    expect(userPhotosSwitch).not.toBeChecked();
    expect(patientPhotosSwitch).toBeChecked();
    expect(screen.getByText("Deshabilitado")).toBeInTheDocument();
    expect(screen.getByText("Habilitado")).toBeInTheDocument();
  });

  it("envía la configuración mediante PUT y muestra la confirmación", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: updatedSettings,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    render(<AdminSettingsForm initialSettings={initialSettings} />);

    const appNameInput = screen.getByRole("textbox", {
      name: "Nombre de la aplicación",
    });
    const photoSizeInput = screen.getByRole("spinbutton", {
      name: "Tamaño máximo de fotografías",
    });
    const [userPhotosSwitch, patientPhotosSwitch] = screen.getAllByRole("switch");

    await user.clear(appNameInput);
    await user.type(appNameInput, "Seguimiento BI-RADS");

    await user.clear(photoSizeInput);
    await user.type(photoSizeInput, "8");

    await user.click(userPhotosSwitch);
    await user.click(patientPhotosSwitch);

    await user.click(
      screen.getByRole("button", {
        name: "Guardar configuración",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appName: "Seguimiento BI-RADS",
        defaultTimezone: "America/La_Paz",
        userProfilePhotosEnabled: false,
        patientProfilePhotosEnabled: true,
        profilePhotoMaxSizeMb: 8,
      }),
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "La configuración fue actualizada correctamente.",
    );

    expect(refreshMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra el mensaje devuelto por la API cuando falla la actualización", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "ADMIN_SETTINGS_UPDATE_FAILED",
            message: "No fue posible guardar la configuración.",
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    render(<AdminSettingsForm initialSettings={initialSettings} />);

    await user.click(
      screen.getByRole("button", {
        name: "Guardar configuración",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible guardar la configuración.",
    );
    expect(refreshMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("muestra un error de conexión cuando fetch no puede completarse", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockRejectedValue(new Error("Network error"));

    render(<AdminSettingsForm initialSettings={initialSettings} />);

    await user.click(
      screen.getByRole("button", {
        name: "Guardar configuración",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible conectar con el servidor. Inténtalo nuevamente.",
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
