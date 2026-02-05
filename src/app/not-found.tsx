import Link from "next/link";

/**
 * Global 404 Not Found Page
 *
 * Displayed when a route is not found.
 * Provides a helpful message and link back to home.
 */
export default function NotFound() {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-2xl mb-6">
            <span className="material-symbols-outlined text-primary text-4xl">
              error_outline
            </span>
          </div>

          <h1 className="text-4xl font-bold text-text-primary-dark mb-4">
            404
          </h1>

          <p className="text-xl text-text-secondary mb-8">
            Pagina no encontrada
          </p>

          <p className="text-text-muted mb-8 max-w-md">
            Lo sentimos, la pagina que buscas no existe o ha sido movida.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg h-12 px-6 shadow-lg shadow-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined">home</span>
            Volver al inicio
          </Link>
        </div>
      </body>
    </html>
  );
}
