"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * SoundNotification Hook and Component
 *
 * Manages audio notifications for new orders in the prep console.
 * Uses Web Audio API for reliable sound playback across browsers.
 */

interface UseSoundNotificationOptions {
  /** Whether sound is enabled */
  enabled?: boolean;
  /** Volume level (0-1) */
  volume?: number;
}

/**
 * Hook to manage sound notifications
 * Returns a function to play the notification sound
 */
export function useSoundNotification(options: UseSoundNotificationOptions = {}) {
  const { enabled = true, volume = 0.5 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasUserInteracted = useRef(false);

  // Initialize AudioContext after user interaction (browser requirement)
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasUserInteracted.current) {
        hasUserInteracted.current = true;
        // Create AudioContext on first interaction
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
      }
    };

    // Listen for first user interaction
    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  // Play a notification sound using Web Audio API
  const playNotification = useCallback(() => {
    if (!enabled || !hasUserInteracted.current) return;

    try {
      // Create AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create oscillator for a pleasant notification chime
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Two-tone notification sound
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2); // A5

      // Envelope for pleasant sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(volume * 0.2, ctx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(volume * 0.25, ctx.currentTime + 0.12);
      gainNode.gain.linearRampToValueAtTime(volume * 0.15, ctx.currentTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (error) {
      // Silently fail if audio is not supported
      console.warn("Sound notification failed:", error);
    }
  }, [enabled, volume]);

  return playNotification;
}

/**
 * SoundNotificationProvider Component
 *
 * Optional visual indicator for sound notification state.
 * Can be used to show whether sounds are enabled and provide toggle.
 */

interface SoundNotificationProps {
  /** Whether sound is enabled */
  enabled: boolean;
  /** Callback to toggle sound */
  onToggle: () => void;
  /** Optional CSS classes */
  className?: string;
}

export function SoundNotification({
  enabled,
  onToggle,
  className,
}: SoundNotificationProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        enabled
          ? "bg-primary/20 text-primary hover:bg-primary/30"
          : "bg-surface-dark text-text-muted hover:bg-hover-row"
      } ${className}`}
      aria-label={enabled ? "Disable sound notifications" : "Enable sound notifications"}
    >
      <span className="material-symbols-outlined text-lg">
        {enabled ? "volume_up" : "volume_off"}
      </span>
    </button>
  );
}

export default SoundNotification;
