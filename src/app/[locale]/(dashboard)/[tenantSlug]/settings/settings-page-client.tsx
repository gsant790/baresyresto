"use client";

import { useState, FormEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * SettingsPageClient Component
 *
 * Client-side settings management interface.
 * Allows admins to configure restaurant settings.
 */

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  plan: string;
}

interface Settings {
  vatRate: number;
  reducedVatRate: number;
  tipEnabled: boolean;
  tipPercentages: number[];
  autoDisableOutOfStock: boolean;
  currency: string;
  timezone: string;
  defaultLanguage: string;
}

interface SettingsPageClientProps {
  tenant: Tenant;
  settings: Settings;
  tenantSlug: string;
  locale: string;
  translations: {
    title: string;
    general: string;
    billing: string;
    tips: string;
    integrations: string;
    generalSettings: string;
    billingSettings: string;
    tipsSettings: string;
    vatRate: string;
    currency: string;
    timezone: string;
    language: string;
    tips: {
      title: string;
      enabled: string;
      percentages: string;
    };
    save: string;
    cancel: string;
  };
}

type SettingsTab = "general" | "billing" | "tips" | "integrations";

export function SettingsPageClient({
  tenant,
  settings,
  translations: t,
}: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "general", label: t.general, icon: "settings" },
    { id: "billing", label: t.billing, icon: "receipt" },
    { id: "tips", label: t.tips, icon: "volunteer_activism" },
    { id: "integrations", label: t.integrations, icon: "integration_instructions" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary-dark tracking-tight">
          {t.title}
        </h1>
        <p className="text-text-secondary mt-1">
          Manage your restaurant configuration
        </p>
      </div>

      {/* Settings layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-card-dark rounded-xl border border-separator p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary/20 text-primary"
                    : "text-text-secondary hover:text-text-primary-dark hover:bg-hover-row"
                )}
              >
                <span className="material-symbols-outlined text-lg">
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings content */}
        <div className="flex-1">
          {activeTab === "general" && (
            <GeneralSettings tenant={tenant} translations={t} />
          )}
          {activeTab === "billing" && (
            <BillingSettings settings={settings} translations={t} />
          )}
          {activeTab === "tips" && (
            <TipsSettings settings={settings} translations={t} />
          )}
          {activeTab === "integrations" && <IntegrationsSettings translations={t} />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({
  tenant,
  translations: t,
}: {
  tenant: Tenant;
  translations: SettingsPageClientProps["translations"];
}) {
  return (
    <div className="bg-card-dark rounded-xl border border-separator">
      <div className="px-6 py-4 border-b border-separator">
        <h2 className="text-lg font-semibold text-text-primary-dark">
          {t.generalSettings}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Basic restaurant information
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Restaurant name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Restaurant Name
          </label>
          <input
            type="text"
            defaultValue={tenant.name}
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Email
          </label>
          <input
            type="email"
            defaultValue={tenant.email}
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Phone
          </label>
          <input
            type="tel"
            defaultValue={tenant.phone || ""}
            placeholder="Enter phone number"
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Address
          </label>
          <textarea
            defaultValue={tenant.address || ""}
            placeholder="Enter restaurant address"
            rows={3}
            className={cn(
              "w-full px-4 py-2 rounded-lg resize-none",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          />
        </div>

        {/* Plan info */}
        <div className="p-4 rounded-lg bg-surface-dark border border-separator">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Current Plan
              </p>
              <p className="text-lg font-bold text-text-primary-dark capitalize">
                {tenant.plan.toLowerCase()}
              </p>
            </div>
            <button
              type="button"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "bg-primary/20 text-primary",
                "hover:bg-primary/30 transition-colors"
              )}
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-separator">
          <button
            type="button"
            className={cn(
              "px-6 py-2 rounded-lg font-medium text-sm",
              "bg-surface-dark border border-separator text-text-secondary",
              "hover:bg-hover-row hover:text-text-primary-dark"
            )}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className={cn(
              "px-6 py-2 rounded-lg font-bold text-sm",
              "bg-primary text-white",
              "hover:bg-primary-dark",
              "shadow-lg shadow-primary/20"
            )}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingSettings({
  settings,
  translations: t,
}: {
  settings: Settings;
  translations: SettingsPageClientProps["translations"];
}) {
  return (
    <div className="bg-card-dark rounded-xl border border-separator">
      <div className="px-6 py-4 border-b border-separator">
        <h2 className="text-lg font-semibold text-text-primary-dark">
          {t.billingSettings}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Configure VAT rates and currency
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* VAT Rate */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t.vatRate} (%)
          </label>
          <input
            type="number"
            defaultValue={settings.vatRate}
            min={0}
            max={100}
            step={0.01}
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          />
          <p className="mt-1 text-xs text-text-muted">
            Standard VAT rate applied to orders
          </p>
        </div>

        {/* Reduced VAT Rate */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Reduced VAT Rate (%)
          </label>
          <input
            type="number"
            defaultValue={settings.reducedVatRate}
            min={0}
            max={100}
            step={0.01}
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          />
          <p className="mt-1 text-xs text-text-muted">
            Reduced VAT rate for eligible items
          </p>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t.currency}
          </label>
          <select
            defaultValue={settings.currency}
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          >
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="GBP">British Pound (GBP)</option>
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t.timezone}
          </label>
          <select
            defaultValue={settings.timezone}
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          >
            <option value="Europe/Madrid">Europe/Madrid (CET)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t.language}
          </label>
          <select
            defaultValue={settings.defaultLanguage}
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-surface-dark border border-separator",
              "text-text-primary-dark",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            )}
          >
            <option value="es">Spanish</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-separator">
          <button
            type="button"
            className={cn(
              "px-6 py-2 rounded-lg font-medium text-sm",
              "bg-surface-dark border border-separator text-text-secondary",
              "hover:bg-hover-row hover:text-text-primary-dark"
            )}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className={cn(
              "px-6 py-2 rounded-lg font-bold text-sm",
              "bg-primary text-white",
              "hover:bg-primary-dark",
              "shadow-lg shadow-primary/20"
            )}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function TipsSettings({
  settings,
  translations: t,
}: {
  settings: Settings;
  translations: SettingsPageClientProps["translations"];
}) {
  const [tipEnabled, setTipEnabled] = useState(settings.tipEnabled);
  const [tipPercentages, setTipPercentages] = useState<number[]>(
    settings.tipPercentages ?? [5, 10, 15]
  );
  const [newPercentageInput, setNewPercentageInput] = useState("");
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleTipToggle = (enabled: boolean) => {
    setTipEnabled(enabled);
  };

  const handleDeletePercentage = (index: number) => {
    setTipPercentages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPercentage = () => {
    const value = newPercentageInput.trim();
    if (!value) {
      setSaveMessage({
        type: "error",
        text: "Please enter a percentage value",
      });
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 100) {
      setSaveMessage({
        type: "error",
        text: "Please enter a valid percentage between 0 and 100",
      });
      return;
    }

    if (tipPercentages.includes(num)) {
      setSaveMessage({
        type: "error",
        text: "This percentage already exists",
      });
      return;
    }

    setTipPercentages((prev) => [...prev, num].sort((a, b) => a - b));
    setNewPercentageInput("");
    setSaveMessage(null);
  };

  const handleSaveTips = async () => {
    try {
      // TODO: Call tRPC mutation to save settings
      // For now, just show success message
      console.log("Saving tips:", { tipEnabled, tipPercentages });
      setSaveMessage({ type: "success", text: "Tips settings saved successfully" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveMessage({ type: "error", text: "Failed to save tips settings" });
    }
  };

  return (
    <div className="bg-card-dark rounded-xl border border-separator">
      <div className="px-6 py-4 border-b border-separator">
        <h2 className="text-lg font-semibold text-text-primary-dark">
          {t.tipsSettings}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Configure tipping options for customers
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Save message */}
        {saveMessage && (
          <div
            className={cn(
              "p-4 rounded-lg text-sm font-medium",
              saveMessage.type === "success"
                ? "bg-success/20 text-success border border-success/30"
                : "bg-error/20 text-error border border-error/30"
            )}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Tips enabled toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-surface-dark border border-separator">
          <div>
            <p className="text-sm font-medium text-text-primary-dark">
              {t.tips.enabled}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Allow customers to add tips to their orders
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleTipToggle(!tipEnabled)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              tipEnabled ? "bg-primary" : "bg-surface-dark border border-separator"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                tipEnabled ? "translate-x-7" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* Tip percentages */}
        <div
          className={cn(!tipEnabled && "opacity-50 pointer-events-none")}
        >
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t.tips.percentages}
          </label>
          <div className="space-y-4">
            {/* Percentage chips */}
            <div className="flex flex-wrap gap-3">
              {tipPercentages.map((percentage, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "bg-surface-dark border border-separator"
                  )}
                >
                  <span className="text-text-primary-dark font-medium">
                    {percentage}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeletePercentage(index)}
                    className="text-text-muted hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      close
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add percentage input */}
            <div className="flex gap-2">
              <input
                type="number"
                value={newPercentageInput}
                onChange={(e) => setNewPercentageInput(e.target.value)}
                placeholder="Enter percentage (0-100)"
                min="0"
                max="100"
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg",
                  "bg-surface-dark border border-separator",
                  "text-text-primary-dark placeholder:text-text-muted",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                )}
              />
              <button
                type="button"
                onClick={handleAddPercentage}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary/20 text-primary border border-primary/30",
                  "hover:bg-primary/30 transition-colors"
                )}
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Suggested tip percentages shown to customers
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-separator">
          <button
            type="button"
            className={cn(
              "px-6 py-2 rounded-lg font-medium text-sm",
              "bg-surface-dark border border-separator text-text-secondary",
              "hover:bg-hover-row hover:text-text-primary-dark"
            )}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSaveTips}
            className={cn(
              "px-6 py-2 rounded-lg font-bold text-sm",
              "bg-primary text-white",
              "hover:bg-primary-dark",
              "shadow-lg shadow-primary/20"
            )}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationsSettings({ translations: t }: { translations: SettingsPageClientProps["translations"] }) {
  return (
    <div className="bg-card-dark rounded-xl border border-separator">
      <div className="px-6 py-4 border-b border-separator">
        <h2 className="text-lg font-semibold text-text-primary-dark">
          {t.integrations}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Connect with third-party services
        </p>
      </div>

      <div className="p-6">
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-text-muted mb-4">
            integration_instructions
          </span>
          <p className="text-text-secondary">
            Integrations coming soon
          </p>
          <p className="text-xs text-text-muted mt-2">
            Connect with payment processors, delivery services, and more
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPageClient;
