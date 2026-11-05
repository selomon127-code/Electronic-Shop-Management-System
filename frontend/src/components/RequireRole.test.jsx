import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireRole from "./RequireRole";

describe("RequireRole", () => {
  it("redirects system admins away from business-owner pages", () => {
    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <RequireRole user={{ role: "system_admin" }} roles={["business_owner"]}>
                <p>Business dashboard</p>
              </RequireRole>
            }
          />
          <Route path="/admin/system" element={<p>System health</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("System health")).toBeInTheDocument();
    expect(screen.queryByText("Business dashboard")).not.toBeInTheDocument();
  });

  it("renders a page when the user's role is allowed", () => {
    render(
      <MemoryRouter>
        <RequireRole user={{ role: "business_owner" }} roles={["business_owner"]}>
          <p>Business dashboard</p>
        </RequireRole>
      </MemoryRouter>,
    );

    expect(screen.getByText("Business dashboard")).toBeInTheDocument();
  });
});
