import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import i18n from "../i18n";
import AIChatbotWidget from "./AIChatbotWidget";

vi.mock("../api/axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("AIChatbotWidget service fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows a helpful assistant response when the chat API returns 503", async () => {
    API.post.mockRejectedValue({
      response: {
        status: 503,
        data: { reply: "Product data is temporarily unavailable. Please try again shortly." },
      },
    });
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AIChatbotWidget />
        </MemoryRouter>
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open chat" }));
    fireEvent.change(screen.getByLabelText("Type your message"), {
      target: { value: "Laptop for programming under 50,000 ETB" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form"));

    expect(await screen.findByText("Product data is temporarily unavailable. Please try again shortly.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument());
  });

  it("keeps an explicit English preference in later chat requests", async () => {
    API.post.mockResolvedValue({ data: { reply: "I can help with that." } });
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AIChatbotWidget />
        </MemoryRouter>
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open chat" }));
    fireEvent.change(screen.getByLabelText("Type your message"), {
      target: { value: "Please answer in English." },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form"));
    await waitFor(() => expect(API.post).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Type your message"), {
      target: { value: "How many products are in the catalog?" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send message" }).closest("form"));
    await waitFor(() => expect(API.post).toHaveBeenCalledTimes(2));
    expect(API.post.mock.calls[1][1].language).toBe("en");
  });
});
