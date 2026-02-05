"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  translations: {
    restaurant: string;
    restaurantPlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submit: string;
    forgotPassword: string;
    errors: {
      invalidCredentials: string;
      tenantNotFound: string;
      accountDisabled: string;
    };
  };
  locale: string;
}

export function LoginForm({ translations: t, locale }: LoginFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const tenantSlug = formData.get("tenantSlug") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        tenantSlug,
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Map error codes to user-friendly messages
        if (result.error.includes("tenant")) {
          setError(t.errors.tenantNotFound);
        } else if (result.error.includes("disabled")) {
          setError(t.errors.accountDisabled);
        } else {
          setError(t.errors.invalidCredentials);
        }
      } else if (result?.ok) {
        // Redirect to dashboard
        router.push(`/${locale}/${tenantSlug}/dashboard`);
        router.refresh();
      }
    } catch {
      setError(t.errors.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Restaurant slug */}
      <div>
        <label
          htmlFor="tenantSlug"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {t.restaurant}
        </label>
        <input
          type="text"
          id="tenantSlug"
          name="tenantSlug"
          placeholder={t.restaurantPlaceholder}
          defaultValue="demo-restaurant"
          className="w-full h-12 px-4 bg-background-dark rounded-lg border border-separator focus:border-primary/50 text-text-primary-dark placeholder-text-muted outline-none transition-colors"
          required
          disabled={isLoading}
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {t.email}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder={t.emailPlaceholder}
          className="w-full h-12 px-4 bg-background-dark rounded-lg border border-separator focus:border-primary/50 text-text-primary-dark placeholder-text-muted outline-none transition-colors"
          required
          disabled={isLoading}
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {t.password}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder={t.passwordPlaceholder}
          className="w-full h-12 px-4 bg-background-dark rounded-lg border border-separator focus:border-primary/50 text-text-primary-dark placeholder-text-muted outline-none transition-colors"
          required
          disabled={isLoading}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading && (
          <span className="material-symbols-outlined animate-spin text-lg">
            progress_activity
          </span>
        )}
        {t.submit}
      </button>
    </form>
  );
}
