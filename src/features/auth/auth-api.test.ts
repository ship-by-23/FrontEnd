import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../lib/api/client";
import { registerUser } from "./auth-api";

vi.mock("../../lib/api/client", () => ({ apiRequest: vi.fn() }));

const mockedApiRequest = vi.mocked(apiRequest);

describe("auth API boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the backend registration confirmation field", () => {
    registerUser({
      name: "Ari",
      email: "ari@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(mockedApiRequest).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      retryUnauthorized: false,
      body: JSON.stringify({
        name: "Ari",
        email: "ari@example.com",
        password: "password123",
        passwordConfirmation: "password123",
      }),
    });
  });
});
