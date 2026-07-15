import { describe, expect, it } from "vitest";
import { parsePatientListQuery } from "@/lib/validations/patient-list";

describe("parsePatientListQuery", () => {
  it("returns defaults for missing parameters", () => {
    expect(parsePatientListQuery({})).toEqual({
      search: "",
      status: "ALL",
      page: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortDirection: "desc",
    });
  });

  it("parses supported query parameters", () => {
    expect(
      parsePatientListQuery({
        search: "  Ana  ",
        status: "ACTIVE",
        page: "2",
        pageSize: "20",
        sortBy: "fullName",
        sortDirection: "asc",
      }),
    ).toEqual({
      search: "Ana",
      status: "ACTIVE",
      page: 2,
      pageSize: 20,
      sortBy: "fullName",
      sortDirection: "asc",
    });
  });

  it("falls back to safe values for unsupported parameters", () => {
    expect(
      parsePatientListQuery({
        status: "UNKNOWN",
        page: "-4",
        pageSize: "500",
        sortBy: "invalid",
        sortDirection: "invalid",
      }),
    ).toEqual({
      search: "",
      status: "ALL",
      page: 1,
      pageSize: 10,
      sortBy: "createdAt",
      sortDirection: "desc",
    });
  });
});
