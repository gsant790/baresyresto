"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ElapsedTimer Component
 *
 * Displays the elapsed time since an order was created.
 * Updates every second to show live countdown in MM:SS format.
 * Color-coded based on elapsed time to indicate urgency:
 * - Green: < 5 minutes
 * - Orange: 5-10 minutes
 * - Red: > 10 minutes
 */

interface ElapsedTimerProps {
  /** The start time of the order */
  startTime: Date | string;
  /** Optional CSS classes */
  className?: string;
  /** Show large format for card headers */
  large?: boolean;
}

export function ElapsedTimer({
  startTime,
  className,
  large = false,
}: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState<string>("0:00");
  const [urgencyLevel, setUrgencyLevel] = useState<"normal" | "warning" | "urgent">("normal");

  useEffect(() => {
    const start = typeof startTime === "string" ? new Date(startTime) : startTime;

    const updateElapsed = () => {
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;

      setElapsed(`${minutes}:${seconds.toString().padStart(2, "0")}`);

      // Set urgency level based on elapsed minutes
      if (minutes >= 10) {
        setUrgencyLevel("urgent");
      } else if (minutes >= 5) {
        setUrgencyLevel("warning");
      } else {
        setUrgencyLevel("normal");
      }
    };

    // Initial update
    updateElapsed();

    // Update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const urgencyStyles = {
    normal: "text-text-secondary",
    warning: "text-orange-400",
    urgent: "text-red-400 animate-pulse",
  };

  return (
    <span
      className={cn(
        "font-mono font-medium tabular-nums",
        urgencyStyles[urgencyLevel],
        large ? "text-lg" : "text-sm",
        className
      )}
    >
      {elapsed}
    </span>
  );
}

export default ElapsedTimer;
