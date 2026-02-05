"use client";

import { useEffect } from "react";

/**
 * Global Error Boundary
 *
 * Catches errors in the application and displays a user-friendly message.
 * Includes a retry button to attempt recovery.
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-error/20 rounded-2xl mb-6">
            <span className="material-symbols-outlined text-error text-4xl">
              warning
            </span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary-dark mb-4">
            Algo salio mal
          </h1>

          <p className="text-text-secondary mb-8 max-w-md">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>

          {error.digest && (
            <p className="text-xs text-text-muted mb-4">
              Codigo de error: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg h-12 px-6 shadow-lg shadow-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined">refresh</span>
              Reintentar
            </button>

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Using <a> intentionally in error boundary as Next.js router may be broken */}
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-surface-dark hover:bg-hover-row text-text-secondary font-medium rounded-lg h-12 px-6 border border-separator transition-colors"
            >
              <span className="material-symbols-outlined">home</span>
              Volver al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
