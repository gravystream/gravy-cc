import { render, screen, fireEvent, act } from "@testing-library/react";
import { NotificationBanner } from "@/components/NotificationBanner";

const mockSubscribe = jest.fn().mockResolvedValue(true);
jest.mock("@/hooks/use-push-notifications", () => ({
  usePushNotifications: () => ({
    permission: "default",
    isSubscribed: false,
    isLoading: false,
    isSupported: true,
    subscribe: mockSubscribe,
    unsubscribe: jest.fn(),
  }),
}));

describe("NotificationBanner", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSubscribe.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders after delay", () => {
    render(<NotificationBanner />);
    expect(screen.queryByText("Enable Notifications")).toBeNull();
    act(() => { jest.advanceTimersByTime(6000); });
    expect(screen.getByText("Enable Notifications")).toBeInTheDocument();
  });

  it("has Enable and Not now buttons", () => {
    render(<NotificationBanner />);
    act(() => { jest.advanceTimersByTime(6000); });
    expect(screen.getByText("Enable")).toBeInTheDocument();
    expect(screen.getByText("Not now")).toBeInTheDocument();
  });

  it("dismisses when Not now is clicked", () => {
    render(<NotificationBanner />);
    act(() => { jest.advanceTimersByTime(6000); });
    fireEvent.click(screen.getByText("Not now"));
    expect(screen.queryByText("Enable Notifications")).toBeNull();
  });
});
