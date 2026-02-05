"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import type { DishData } from "./dish-card";

/**
 * DishForm Component
 *
 * Form for creating or editing a dish.
 * Includes fields for:
 * - name (ES) and nameEn (EN)
 * - description (ES) and descriptionEn (EN)
 * - price
 * - category
 * - allergens (multi-select)
 * - image URL
 */

// Common allergens list
export const COMMON_ALLERGENS = [
  { id: "gluten", label: "Gluten", icon: "bakery_dining" },
  { id: "crustaceans", label: "Crustaceans", icon: "set_meal" },
  { id: "eggs", label: "Eggs", icon: "egg" },
  { id: "fish", label: "Fish", icon: "phishing" },
  { id: "peanuts", label: "Peanuts", icon: "nutrition" },
  { id: "soybeans", label: "Soybeans", icon: "eco" },
  { id: "milk", label: "Milk", icon: "water_drop" },
  { id: "nuts", label: "Tree Nuts", icon: "forest" },
  { id: "celery", label: "Celery", icon: "grass" },
  { id: "mustard", label: "Mustard", icon: "local_florist" },
  { id: "sesame", label: "Sesame", icon: "grain" },
  { id: "sulphites", label: "Sulphites", icon: "science" },
  { id: "lupin", label: "Lupin", icon: "local_florist" },
  { id: "molluscs", label: "Molluscs", icon: "set_meal" },
] as const;

export interface CategoryOption {
  id: string;
  name: string;
  prepSector?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface DishFormProps {
  dish?: Partial<DishData>;
  categories: CategoryOption[];
  onSubmit: (data: DishFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface DishFormData {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  price: number;
  categoryId: string;
  allergens: string[];
  imageUrl?: string | null;
  isAvailable?: boolean;
}

export function DishForm({
  dish,
  categories,
  onSubmit,
  onCancel,
  isLoading,
}: DishFormProps) {
  const [name, setName] = useState(dish?.name || "");
  const [nameEn, setNameEn] = useState(dish?.nameEn || "");
  const [description, setDescription] = useState(dish?.description || "");
  const [descriptionEn, setDescriptionEn] = useState(dish?.descriptionEn || "");
  const [price, setPrice] = useState(dish?.price?.toString() || "");
  const [categoryId, setCategoryId] = useState(dish?.category?.id || "");
  const [allergens, setAllergens] = useState<string[]>(dish?.allergens || []);
  const [imageUrl, setImageUrl] = useState(dish?.imageUrl || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!dish?.id;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length > 100) {
      newErrors.name = "Name must be 100 characters or less";
    }

    // Validate price
    const priceValue = parseFloat(price);
    if (!price || isNaN(priceValue) || priceValue <= 0) {
      newErrors.price = "Price must be a positive number";
    } else if (priceValue > 9999.99) {
      newErrors.price = "Price must be less than 10,000";
    }

    // Validate category
    if (!categoryId) {
      newErrors.categoryId = "Category is required";
    }

    // Validate image URL if provided
    if (imageUrl && !isValidUrl(imageUrl)) {
      newErrors.imageUrl = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      nameEn: nameEn.trim() || null,
      description: description.trim() || null,
      descriptionEn: descriptionEn.trim() || null,
      price: parseFloat(price),
      categoryId,
      allergens,
      imageUrl: imageUrl.trim() || null,
    });
  };

  const toggleAllergen = (allergenId: string) => {
    setAllergens((prev) =>
      prev.includes(allergenId)
        ? prev.filter((a) => a !== allergenId)
        : [...prev, allergenId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name (Spanish) */}
      <div className="space-y-2">
        <label
          htmlFor="dish-name"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Name (Spanish) <span className="text-error">*</span>
        </label>
        <input
          id="dish-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Paella Valenciana"
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
          htmlFor="dish-name-en"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Name (English)
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <input
          id="dish-name-en"
          type="text"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="e.g., Valencian Paella"
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-surface-dark border border-separator text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50"
          )}
          disabled={isLoading}
        />
      </div>

      {/* Price and Category row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Price */}
        <div className="space-y-2">
          <label
            htmlFor="dish-price"
            className="block text-sm font-medium text-text-primary-dark"
          >
            Price <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              id="dish-price"
              type="number"
              step="0.01"
              min="0"
              max="9999.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className={cn(
                "w-full h-10 pl-8 pr-4 rounded-lg",
                "bg-surface-dark border text-text-primary-dark",
                "placeholder:text-text-muted",
                "focus:outline-none focus:border-primary/50",
                errors.price ? "border-error" : "border-separator"
              )}
              disabled={isLoading}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              $
            </span>
          </div>
          {errors.price && <p className="text-xs text-error">{errors.price}</p>}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label
            htmlFor="dish-category"
            className="block text-sm font-medium text-text-primary-dark"
          >
            Category <span className="text-error">*</span>
          </label>
          <select
            id="dish-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={cn(
              "w-full h-10 px-4 rounded-lg appearance-none",
              "bg-surface-dark border text-text-primary-dark",
              "focus:outline-none focus:border-primary/50",
              errors.categoryId ? "border-error" : "border-separator",
              !categoryId && "text-text-muted"
            )}
            disabled={isLoading}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.prepSector ? ` (${category.prepSector.code})` : ""}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-xs text-error">{errors.categoryId}</p>
          )}
        </div>
      </div>

      {/* Description (Spanish) */}
      <div className="space-y-2">
        <label
          htmlFor="dish-description"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Description (Spanish)
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <textarea
          id="dish-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the dish ingredients and preparation..."
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

      {/* Description (English) */}
      <div className="space-y-2">
        <label
          htmlFor="dish-description-en"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Description (English)
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <textarea
          id="dish-description-en"
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          placeholder="English description for international guests..."
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

      {/* Image URL */}
      <div className="space-y-2">
        <label
          htmlFor="dish-image"
          className="block text-sm font-medium text-text-primary-dark"
        >
          Image URL
          <span className="text-text-muted ml-1">(optional)</span>
        </label>
        <input
          id="dish-image"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/dish-image.jpg"
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-surface-dark border text-text-primary-dark",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary/50",
            errors.imageUrl ? "border-error" : "border-separator"
          )}
          disabled={isLoading}
        />
        {errors.imageUrl && (
          <p className="text-xs text-error">{errors.imageUrl}</p>
        )}
        {imageUrl && isValidUrl(imageUrl) && (
          <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-surface-dark border border-separator">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Allergens */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary-dark">
          Allergens
          <span className="text-text-muted ml-1">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {COMMON_ALLERGENS.map((allergen) => {
            const isSelected = allergens.includes(allergen.id);
            return (
              <button
                key={allergen.id}
                type="button"
                onClick={() => toggleAllergen(allergen.id)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                  "border transition-colors",
                  isSelected
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-surface-dark text-text-secondary border-separator hover:bg-hover-row hover:text-text-primary-dark",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="material-symbols-outlined text-lg">
                  {allergen.icon}
                </span>
                <span className="truncate">{allergen.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-sm ml-auto">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {allergens.length > 0 && (
          <p className="text-xs text-text-muted mt-2">
            {allergens.length} allergen{allergens.length !== 1 ? "s" : ""}{" "}
            selected
          </p>
        )}
      </div>

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
          {isEdit ? "Save Changes" : "Create Dish"}
        </button>
      </div>
    </form>
  );
}

export default DishForm;
