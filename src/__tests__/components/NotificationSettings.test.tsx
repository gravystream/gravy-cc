import { render, screen } from "@testing-library/react";
import { NotificationSettings } from "@/components/NotificationSettings";

jest.mock("@/hooks/use-push-notifications", () => ({
  usePushNotifications: () => ({
    permission: "default",
    isSubscribed: false,
    isLoading: false,
    isSupported: true,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
}));

describe("NotificationSettings", () => {
  it("renders notification settings", () => {
    render(<NotificationSettings />);
    expect(screen.getByText(/notification/i)).toBeInTheDocument();
  });

  it("shows enable button when not subscribed", () => {
    render(<NotificationSettings />);
    const btn = screen.queryByRole("button");
    expect(btn).toBeTruthy();
  });
});
