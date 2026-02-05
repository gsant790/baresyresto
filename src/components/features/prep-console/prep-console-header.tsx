"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * PrepConsoleHeader Component
 *
 * Header for the preparation console showing sector name,
 * current time, average ticket time, online status, and system info.
 */

interface PrepConsoleHeaderProps {
  /** Sector display name (Kitchen/Bar) */
  sectorName: string;
  /** Sector code for icon selection */
  sectorCode: "KITCHEN" | "BAR";
  /** Stats for the console */
  stats: {
    pending: number;
    inProgress: number;
    ready: number;
  };
  /** Average ticket time in seconds */
  avgTicketTime?: number;
  /** Whether the console is online */
  isOnline?: boolean;
  /** Connection latency in milliseconds */
  latency?: number;
  /** Callback for logout */
  onLogout?: () => void;
  /** Last data fetch timestamp */
  lastUpdated?: Date;
  /** Whether data is currently being fetched */
  isRefetching?: boolean;
  /** Translation strings */
  translations: {
    title: string;
    newOrders: string;
    inPrep: string;
    ready: string;
    avgTime: string;
    online: string;
    offline: string;
    logout: string;
  };
}

export function PrepConsoleHeader({
  sectorName,
  sectorCode,
  stats,
  avgTicketTime,
  isOnline = true,
  latency,
  onLogout,
  lastUpdated,
  isRefetching = false,
  translations: t,
}: PrepConsoleHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const sectorIcon = sectorCode === "KITCHEN" ? "skillet" : "local_bar";

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format average ticket time
  const formatAvgTime = (seconds?: number) => {
    if (!seconds) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get connection quality indicator
  const getConnectionQuality = () => {
    if (!isOnline) return { color: "text-red-400", label: t.offline };
    if (!latency) return { color: "text-green-400", label: t.online };

    if (latency < 100) return { color: "text-green-400", label: t.online };
    if (latency < 300) return { color: "text-orange-400", label: t.online };
    return { color: "text-red-400", label: t.online };
  };

  const connectionStatus = getConnectionQuality();

  return (
    <header className="bg-card-dark border-b border-separator sticky top-0 z-20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Title Section with Time */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">
                {sectorIcon}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary-dark">
                {t.title}
              </h1>
              <p className="text-text-secondary text-sm">{sectorName}</p>
            </div>
            <div className="h-10 w-px bg-separator" />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                {new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-lg font-mono font-bold text-text-primary-dark tabular-nums">
                {currentTime}
              </span>
            </div>
            {avgTicketTime !== undefined && (
              <>
                <div className="h-10 w-px bg-separator" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">
                    {t.avgTime}
                  </span>
                  <span className="text-lg font-mono font-bold text-orange-400 tabular-nums">
                    {formatAvgTime(avgTicketTime)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Stats Section */}
          <div className="flex items-center gap-3">
            {/* Pending */}
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-blue-400 font-bold text-lg">
                {stats.pending}
              </span>
              <span className="text-blue-400 text-xs font-medium">{t.newOrders}</span>
            </div>

            {/* In Progress */}
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-orange-400 font-bold text-lg">
                {stats.inProgress}
              </span>
              <span className="text-orange-400 text-xs font-medium">{t.inPrep}</span>
            </div>

            {/* Ready */}
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-green-400 font-bold text-lg">
                {stats.ready}
              </span>
              <span className="text-green-400 text-xs font-medium">{t.ready}</span>
            </div>
          </div>

          {/* Online Status & Logout */}
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline && !isRefetching ? "bg-green-400" : "bg-red-400",
                  isRefetching && "animate-pulse"
                )}
              />
              <span className={connectionStatus.color}>
                {connectionStatus.label}
              </span>
              {latency && isOnline && (
                <span className="text-text-muted text-xs">
                  ({latency}ms)
                </span>
              )}
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                aria-label={t.logout}
              >
                <span className="material-symbols-outlined text-lg">
                  logout
                </span>
                <span className="text-sm font-medium hidden lg:inline">
                  {t.logout}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default PrepConsoleHeader;
