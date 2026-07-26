// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePhotoEditor } from "@/components/profile-photo/ProfilePhotoEditor";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ProfilePhotoEditor", () => {
  it("muestra las iniciales cuando no existe fotografía", () => {
    render(
      <ProfilePhotoEditor
        endpoint="/api/patients/patient-1/photo"
        initials="AL"
        alt="Fotografía de Ana López"
        initialHasPhoto={false}
      />,
    );

    expect(screen.getByText("AL")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Subir fotografía",
      }),
    ).toBeTruthy();
  });

  it("rechaza un formato de archivo no permitido", () => {
    render(
      <ProfilePhotoEditor
        endpoint="/api/patients/patient-1/photo"
        initials="AL"
        alt="Fotografía de Ana López"
        initialHasPhoto={false}
      />,
    );

    const input = screen.getByLabelText(
      "Seleccionar fotografía de perfil",
    );

    const file = new File(["contenido"], "documento.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByRole("alert").textContent,
    ).toContain("Selecciona una imagen JPEG, PNG o WebP.");
  });

  it("rechaza una fotografía superior a 5 MB", () => {
    render(
      <ProfilePhotoEditor
        endpoint="/api/patients/patient-1/photo"
        initials="AL"
        alt="Fotografía de Ana López"
        initialHasPhoto={false}
      />,
    );

    const input = screen.getByLabelText(
      "Seleccionar fotografía de perfil",
    );

    const file = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "fotografia.jpg",
      {
        type: "image/jpeg",
      },
    );

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByRole("alert").textContent,
    ).toContain("La fotografía no puede superar los 5 MB.");
  });

  it("carga una fotografía válida mediante el endpoint protegido", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              hasPhoto: true,
              previousPhotoCleanupFailed: false,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

    const user = userEvent.setup();

    render(
      <ProfilePhotoEditor
        endpoint="/api/patients/patient-1/photo"
        initials="AL"
        alt="Fotografía de Ana López"
        initialHasPhoto={false}
      />,
    );

    const input = screen.getByLabelText(
      "Seleccionar fotografía de perfil",
    );

    const file = new File(["imagen"], "fotografia.png", {
      type: "image/png",
    });

    await user.upload(input, file);

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/patients/patient-1/photo");
    expect(options?.method).toBe("POST");
    expect(options?.body).toBeInstanceOf(FormData);

    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent(
      "La fotografía fue actualizada correctamente.",
    );

    expect(
      screen.getByRole("button", {
        name: "Cambiar fotografía",
      }),
    ).toBeTruthy();
  });

  it("elimina una fotografía después de confirmar la acción", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              hasPhoto: false,
              previousPhotoCleanupFailed: false,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

    const user = userEvent.setup();

    render(
      <ProfilePhotoEditor
        endpoint="/api/patients/patient-1/photo"
        initials="AL"
        alt="Fotografía de Ana López"
        initialHasPhoto
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Eliminar",
      }),
    );

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/patients/patient-1/photo",
      {
        method: "DELETE",
      },
    );

    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent(
      "La fotografía fue eliminada correctamente.",
    );

    expect(screen.getByText("AL")).toBeTruthy();
  });
});