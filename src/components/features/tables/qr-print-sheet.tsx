"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { buildTableUrl } from "@/lib/qr";
import type { Table } from "@prisma/client";

/**
 * QRPrintSheet Component
 *
 * Generates a printable sheet with QR codes for multiple tables.
 * Designed for A4 paper with 2 columns and 3 rows per page.
 */

interface QRPrintSheetProps {
  tables: Table[];
  tenantSlug: string;
  tenantName: string;
  locale?: string;
}

interface QRItem {
  tableNumber: number;
  tableName: string | null;
  qrCode: string;
  dataUrl: string;
  url: string;
}

export function QRPrintSheet({
  tables,
  tenantSlug,
  tenantName,
  locale = "es",
}: QRPrintSheetProps) {
  const [qrItems, setQrItems] = useState<QRItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateQRCodes = async () => {
      setIsGenerating(true);

      const items: QRItem[] = [];

      for (const table of tables) {
        const url = buildTableUrl(tenantSlug, table.qrCode, locale);

        try {
          const dataUrl = await QRCode.toDataURL(url, {
            width: 200,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
            errorCorrectionLevel: "H",
          });

          items.push({
            tableNumber: table.number,
            tableName: table.name,
            qrCode: table.qrCode,
            dataUrl,
            url,
          });
        } catch (err) {
          console.error(`Failed to generate QR for table ${table.number}:`, err);
        }
      }

      setQrItems(items);
      setIsGenerating(false);
    };

    generateQRCodes();
  }, [tables, tenantSlug, locale]);

  const handlePrint = () => {
    window.print();
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">
          progress_activity
        </span>
        <p className="text-text-secondary">
          Generating QR codes for {tables.length} tables...
        </p>
      </div>
    );
  }

  if (qrItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-5xl text-text-muted mb-4">
          qr_code_2
        </span>
        <p className="text-text-secondary">
          No tables selected for printing.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Print controls (hidden when printing) */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary-dark">
            QR Code Print Sheet
          </h3>
          <p className="text-sm text-text-secondary">
            {qrItems.length} table{qrItems.length !== 1 ? "s" : ""} ready for
            printing
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm",
            "bg-primary text-white",
            "hover:bg-primary-dark",
            "shadow-lg shadow-primary/20"
          )}
        >
          <span className="material-symbols-outlined text-lg">print</span>
          Print QR Codes
        </button>
      </div>

      {/* Printable content */}
      <div
        ref={printRef}
        className={cn(
          "print:p-0 print:bg-white",
          "bg-white rounded-xl p-8"
        )}
      >
        {/* Print header (visible only when printing) */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{tenantName}</h1>
          <p className="text-gray-600">Table QR Codes</p>
        </div>

        {/* QR Code grid */}
        <div
          className={cn(
            "grid grid-cols-2 gap-6",
            "print:gap-4"
          )}
        >
          {qrItems.map((item) => (
            <div
              key={item.qrCode}
              className={cn(
                "flex flex-col items-center p-6",
                "border-2 border-dashed border-gray-300 rounded-xl",
                "print:border-gray-400 print:p-4",
                "break-inside-avoid"
              )}
            >
              {/* Table number */}
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Table {item.tableNumber}
              </h2>

              {/* Table name */}
              {item.tableName && (
                <p className="text-sm text-gray-600 mb-3">{item.tableName}</p>
              )}

              {/* QR Code */}
              <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
                <img
                  src={item.dataUrl}
                  alt={`QR code for Table ${item.tableNumber}`}
                  width={160}
                  height={160}
                  className="block print:w-40 print:h-40"
                />
              </div>

              {/* QR Code value */}
              <p className="mt-3 text-sm font-mono text-gray-700">
                {item.qrCode}
              </p>

              {/* Restaurant name */}
              <p className="mt-2 text-xs text-gray-500">{tenantName}</p>

              {/* Instructions */}
              <p className="mt-1 text-xs text-gray-400">
                Scan to view menu & order
              </p>
            </div>
          ))}
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          Generated by BaresyResto
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }

          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default QRPrintSheet;
