"use client";

import { Button } from "~/components/ui/Button";
import { useToast } from "~/components/providers/ToastProvider";

export default function NotificationDemoPage() {
  const { showToast } = useToast();

  const showSuccessToast = () => {
    showToast({
      message: "Operation completed successfully!",
      type: "success",
    });
  };

  const showErrorToast = () => {
    showToast({
      message: "Something went wrong!",
      type: "error",
    });
  };

  const showInfoToast = () => {
    showToast({
      message: "Did you know? You can customize these notifications!",
      type: "info",
    });
  };

  const showWarningToast = () => {
    showToast({
      message: "Please proceed with caution",
      type: "warning",
    });
  };

  const showCustomDurationToast = () => {
    showToast({
      message: "I'll stay here for 10 seconds!",
      type: "info",
      duration: 10000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Notification Demo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button onClick={showSuccessToast} className="bg-green-500 hover:bg-green-600">
          Show Success Toast
        </Button>
        <Button onClick={showErrorToast} className="bg-red-500 hover:bg-red-600">
          Show Error Toast
        </Button>
        <Button onClick={showInfoToast} className="bg-blue-500 hover:bg-blue-600">
          Show Info Toast
        </Button>
        <Button onClick={showWarningToast} className="bg-yellow-500 hover:bg-yellow-600">
          Show Warning Toast
        </Button>
        <Button onClick={showCustomDurationToast} className="bg-purple-500 hover:bg-purple-600">
          Show Long Duration Toast
        </Button>
      </div>
    </div>
  );
}