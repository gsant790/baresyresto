"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

/**
 * QRDisplay Component
 *
 * Displays a QR code for a table's menu URL.
 * Supports downloading the QR code as a PNG image.
 */

interface QRDisplayProps {
  url: string;
  tableNumber: number;
  tableName?: string | null;
  qrCode: string;
  size?: number;
  className?: string;
}

export function QRDisplay({
  url,
  tableNumber,
  tableName,
  qrCode,
  size = 200,
  className,
}: QRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: size,
          margin: 2,
          color: {
            dark: "#231810", // Dark background color from design tokens
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H", // High error correction for reliability
        });
        setQrDataUrl(dataUrl);
        setError(null);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
        setError("Failed to generate QR code");
      }
    };

    generateQR();
  }, [url, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `table-${tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8",
          "bg-card-dark rounded-xl border border-separator",
          className
        )}
      >
        <span className="material-symbols-outlined text-4xl text-error mb-2">
          error
        </span>
        <p className="text-text-secondary text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center p-6",
        "bg-card-dark rounded-xl border border-separator",
        className
      )}
    >
      {/* Table info header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-text-primary-dark">
          Table {tableNumber}
        </h3>
        {tableName && (
          <p className="text-sm text-text-secondary">{tableName}</p>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR code for Table ${tableNumber}`}
            width={size}
            height={size}
            className="block"
          />
        ) : (
          <div
            className="flex items-center justify-center bg-gray-100"
            style={{ width: size, height: size }}
          >
            <span className="material-symbols-outlined animate-spin text-3xl text-gray-400">
              progress_activity
            </span>
          </div>
        )}
      </div>

      {/* QR Code value */}
      <div className="mt-4 px-4 py-2 bg-surface-dark rounded-lg border border-separator">
        <code className="text-sm font-mono text-primary">{qrCode}</code>
      </div>

      {/* URL preview */}
      <p className="mt-2 text-xs text-text-muted max-w-full truncate">
        {url}
      </p>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!qrDataUrl}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-primary text-white",
            "hover:bg-primary-dark",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Download
        </button>
        <button
          type="button"
          onClick={handleCopyUrl}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-surface-dark border border-separator text-text-secondary",
            "hover:bg-hover-row hover:text-text-primary-dark"
          )}
        >
          <span className="material-symbols-outlined text-lg">content_copy</span>
          Copy URL
        </button>
      </div>
    </div>
  );
}

export default QRDisplay;
