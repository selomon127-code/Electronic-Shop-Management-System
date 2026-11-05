import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import API from "./api/axios";
import { server } from "./mocks/server";

API.defaults.adapter = "fetch";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// 1. window.matchMedia ሞክ ማድረግ
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 2. IntersectionObserver ሞክ ማድረግ (Home.jsx ውስጥ ለሚጠቀሙባቸው አኒሜሽኖች/ስክሮሎች)
class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
