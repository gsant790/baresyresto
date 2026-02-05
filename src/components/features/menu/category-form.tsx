"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import type { CategoryData } from "./category-list";

/**
 * CategoryForm Component
 *
 * Form for creating or editing a category.
 * Includes fields for:
 * - name (ES) and nameEn (EN)
 * - description
 * - prep sector
 * - active status
 */

export interface PrepSectorOption {
  id: string;
  name: string;
  code: string;
}

interface CategoryFormProps {
  category?: Partial<CategoryData>;
  prepSectors: PrepSectorOption[];
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface CategoryFormData {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  prepSectorId: string;
  isActive?: boolean;
}

export function CategoryForm({
  category,
  prepSectors,
  onSubmit,
  onCancel,
  isLoading,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "");
  const [nameEn, setNameEn] = useState(category?.nameEn || "");
  const [description, setDescription] = useState(category?.description || "");
  const [prepSectorId, setPrepSectorId] = useState(
    category?.prepSector?.id || ""
  );
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!category?.id;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name must be 100 characters or less";
    }

    // Validate prep sector
    if (!prepSectorId) {
      newErrors.prepSectorId = "Prep sector is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      nameEn: nameEn.trim() || null,
      description: description.trim() || null,
      prepSectorId,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name (Spanish) */}
      <div className="space-y-2">
        <label
          htmlFor="category-name"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Name (Spanish) <span className="text-error">*</span>
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Entrantes"
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-surface-dark border text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50",
            errors.name ? "border-error" : "border-separator"
          )}
          disabled={isLoading}
        />
        {errors.name && <p className="text-xs text-error">{errors.name}</p>}
      </div>

      {/* Name (English) */}
      <div className="space-y-2">
        <label
          htmlFor="category-name-en"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Name (English)
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <input
          id="category-name-en"
          type="text"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="e.g., Starters"
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-surface-dark border border-separator text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50"
          )}
          disabled={isLoading}
        />
      </div>

      {/* Prep Sector */}
      <div className="space-y-2">
        <label
          htmlFor="category-prep-sector"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Prep Sector <span className="text-error">*</span>
        </label>
        <select
          id="category-prep-sector"
          value={prepSectorId}
          onChange={(e) => setPrepSectorId(e.target.value)}
          className={cn(
            "w-full h-10 px-4 rounded-lg appearance-none",
            "bg-surface-dark border text-text-primary-dark",
            "focus:outline-none focus:border-primary/50",
            errors.prepSectorId ? "border-error" : "border-separator",
            !prepSectorId && "text-text-muted"
          )}
          disabled={isLoading}
        >
          <option value="">Select prep sector</option>
          {prepSectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name} ({sector.code})
            </option>
          ))}
        </select>
        {errors.prepSectorId && (
          <p className="text-xs text-error">{errors.prepSectorId}</p>
        )}
        <p className="text-xs text-text-muted">
          Orders for dishes in this category will be routed to this sector
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="category-description"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Description
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <textarea
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this category..."
          rows={3}
          className={cn(
            "w-full px-4 py-2 rounded-lg resize-none",
            "bg-surface-dark border border-separator text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50"
          )}
          disabled={isLoading}
        />
      </div>

      {/* Active status */}
      {isEdit && (
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isLoading}
              className="sr-only peer"
            />
            <div
              className={cn(
                "w-11 h-6 rounded-full transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background-dark",
                isActive ? "bg-primary" : "bg-separator"
              )}
            >
              <div
                className={cn(
                  "absolute w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ml-0.5",
                  isActive && "translate-x-5"
                )}
              />
            </div>
            <span className="text-sm font-medium text-text-primary-dark">
              Active
            </span>
          </label>
          <p className="text-xs text-text-muted">
            Inactive categories and their dishes will not appear in the customer
            menu
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-separator">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm",
            "bg-surface-dark border border-separator text-text-secondary",
            "hover:bg-hover-row hover:text-text-primary-dark",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "px-6 py-2 rounded-lg font-bold text-sm",
            "bg-primary text-white",
            "hover:bg-primary-dark",
            "shadow-lg shadow-primary/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isLoading && (
            <span className="material-symbols-outlined animate-spin text-lg">
              progress_activity
            </span>
          )}
          {isEdit ? "Save Changes" : "Create Category"}
        </button>
      </div>
    </form>
  );
}

export default CategoryForm;
