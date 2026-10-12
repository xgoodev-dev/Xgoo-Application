import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  message: string | null;
};

export class BookFlowErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message || "This booking page hit a problem." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Hub / Go book page crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.message) return this.props.children;
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <h2 className="text-lg font-bold text-zinc-900">Could not open this booking page</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Reload this page to continue. If you already received a request number, the Hub has the booking.
        </p>
        <Button
          type="button"
          className="mt-5 rounded-xl bg-[#FF4907] text-white hover:bg-[#e03d00]"
          onClick={() => window.location.reload()}
        >
          Reload page
        </Button>
      </div>
    );
  }
}