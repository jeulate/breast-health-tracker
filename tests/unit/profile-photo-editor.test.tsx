// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePhotoEditor } from "@/components/profile-photo/ProfilePhotoEditor";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

    const input = screen.getByLabelText("Seleccionar fotografía de perfil");

    const file = new File(["contenido"], "documento.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "Selecciona una imagen JPEG, PNG o WebP.",
    );
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

    const input = screen.getByLabelText("Seleccionar fotografía de perfil");

    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "fotografia.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(screen.getByRole("alert").textContent).toContain(
      "La fotografía no puede superar los 5 MB.",
    );
  });

  it("carga una fotografía válida mediante el endpoint protegido", async () => {
    let requestInstance: MockXMLHttpRequest | undefined;
    const captureRequestInstance = (request: MockXMLHttpRequest) => {
      requestInstance = request;
    };
    class MockXMLHttpRequest {
      method = "";
      url = "";
      body: Document | XMLHttpRequestBodyInit | null = null;
      status = 200;
      responseText = JSON.stringify({
        success: true,
        data: {
          hasPhoto: true,
          previousPhotoCleanupFailed: false,
        },
      });

      private listeners: Partial<Record<string, EventListener>> = {};
      private uploadProgressListener?: (event: ProgressEvent) => void;

      upload = {
        addEventListener: (type: string, listener: (event: ProgressEvent) => void) => {
          if (type === "progress") {
            this.uploadProgressListener = listener;
          }
        },
      };

      constructor() {
        captureRequestInstance(this);
      }

      open(method: string, url: string) {
        this.method = method;
        this.url = url;
      }

      addEventListener(type: string, listener: EventListener) {
        this.listeners[type] = listener;
      }

      send(body: Document | XMLHttpRequestBodyInit | null) {
        this.body = body;
      }

      emitProgress(loaded: number, total: number) {
        this.uploadProgressListener?.({
          lengthComputable: true,
          loaded,
          total,
        } as ProgressEvent);
      }

      emitLoad() {
        this.listeners.load?.(new Event("load"));
      }
    }

    vi.stubGlobal("XMLHttpRequest", MockXMLHttpRequest);

    const user = userEvent.setup();

    render(
      <ProfilePhotoEditor
        endpoint="/api/patients/patient-1/photo"
        initials="AL"
        alt="Fotografía de Ana López"
        initialHasPhoto={false}
      />,
    );

    const input = screen.getByLabelText("Seleccionar fotografía de perfil");

    const file = new File(["imagen"], "fotografia.png", {
      type: "image/png",
    });

    await user.upload(input, file);

    await waitFor(() => {
      expect(requestInstance).toBeDefined();
    });

    expect(requestInstance?.method).toBe("POST");
    expect(requestInstance?.url).toBe("/api/patients/patient-1/photo");
    expect(requestInstance?.body).toBeInstanceOf(FormData);

    act(() => {
      requestInstance?.emitProgress(50, 100);
    });

    expect(
      screen.getByRole("progressbar", {
        name: "Progreso de carga de la fotografía",
      }),
    ).toHaveAttribute("aria-valuenow", "50");

    expect(screen.getByText("50%")).toBeTruthy();

    act(() => {
      requestInstance?.emitLoad();
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "La fotografía fue actualizada correctamente.",
    );

    expect(
      screen.getByRole("button", {
        name: "Cambiar fotografía",
      }),
    ).toBeTruthy();
  });

  it("elimina una fotografía después de confirmar la acción", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
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

    expect(
      screen.getByRole("dialog", {
        name: "Eliminar fotografía",
      }),
    ).toBeTruthy();

    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", {
        name: "Eliminar fotografía",
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/patients/patient-1/photo", {
        method: "DELETE",
      });
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "La fotografía fue eliminada correctamente.",
    );

    expect(
      screen.queryByRole("dialog", {
        name: "Eliminar fotografía",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("AL")).toBeTruthy();
  });
});
