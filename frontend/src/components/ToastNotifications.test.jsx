import { fireEvent, render, screen } from "@testing-library/react";
import { useToast } from "./ToastNotifications";
import ToastNotifications from "./ToastNotifications";
import { describe, expect, it } from "vitest";

function NotificationActions() {
  const toast = useToast();

  return (
    <>
      <button onClick={() => toast("success", "Saved successfully")}>
        Show success
      </button>
      <button onClick={() => toast("error", "Could not save")}>
        Show error
      </button>
      <ToastNotifications />
    </>
  );
}

describe("Global toast notifications", () => {
  it("shows notifications from the shared API and allows dismissing them", () => {
    render(<NotificationActions />);

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));
    fireEvent.click(screen.getByRole("button", { name: "Show error" }));

    expect(screen.getByRole("status")).toHaveTextContent("Saved successfully");
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");

    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss notification" })[0]);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
