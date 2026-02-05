"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import {
  DishGrid,
  DishForm,
  CategoryList,
  type DishData,
  type DishFormData,
  type CategoryData,
} from "@/components/features/menu";

/**
 * MenuPageClient Component
 *
 * Client-side menu management interface.
 * Handles creating/editing dishes, toggling availability, and category filtering.
 */

interface MenuPageClientProps {
  initialDishes: DishData[];
  initialCategories: (CategoryData & { _count?: { dishes: number } })[];
  stats: {
    total: number;
    available: number;
    unavailable: number;
    outOfStock: number;
    categories: number;
  };
  tenantSlug: string;
  locale: string;
  translations: {
    title: string;
    addDish: string;
    editDish: string;
    searchPlaceholder: string;
    allCategories: string;
    available: string;
    unavailable: string;
    outOfStock: string;
    categories: string;
    noDishes: string;
    confirmDelete: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
  };
}

type ModalState = "none" | "create" | "edit" | "delete";

export function MenuPageClient({
  initialDishes,
  initialCategories,
  stats: initialStats,
  tenantSlug,
  locale,
  translations: t,
}: MenuPageClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedDish, setSelectedDish] = useState<DishData | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingDishId, setTogglingDishId] = useState<string | null>(null);

  // Use tRPC queries - fetch fresh data for type safety
  const {
    data: dishesData,
    refetch: refetchDishes,
  } = api.menu.list.useQuery(undefined);

  // Map to DishData format
  const dishes: DishData[] = (dishesData ?? initialDishes).map(d => ({
    id: d.id,
    name: d.name,
    nameEn: d.nameEn ?? null,
    description: d.description ?? null,
    descriptionEn: d.descriptionEn ?? null,
    price: typeof d.price === 'number' ? d.price : Number(d.price),
    imageUrl: d.imageUrl ?? null,
    allergens: d.allergens,
    isAvailable: d.isAvailable,
    isInStock: d.isInStock,
    displayOrder: d.displayOrder,
    category: d.category,
  }));

  const {
    data: categoriesData,
    refetch: refetchCategories,
  } = api.categories.list.useQuery(undefined);

  const categories = categoriesData ?? initialCategories;

  // Calculate stats from current data
  const stats = {
    total: dishes.length,
    available: dishes.filter((d) => d.isAvailable && d.isInStock).length,
    unavailable: dishes.filter((d) => !d.isAvailable).length,
    outOfStock: dishes.filter((d) => !d.isInStock).length,
    categories: categories.length,
  };

  // Create dish mutation
  const createMutation = api.menu.create.useMutation({
    onSuccess: () => {
      setModalState("none");
      setSelectedDish(null);
      refetchDishes();
      refetchCategories();
    },
  });

  // Update dish mutation
  const updateMutation = api.menu.update.useMutation({
    onSuccess: () => {
      setModalState("none");
      setSelectedDish(null);
      refetchDishes();
    },
  });

  // Toggle availability mutation
  const toggleMutation = api.menu.toggleAvailable.useMutation({
    onMutate: ({ id }) => {
      setTogglingDishId(id);
    },
    onSuccess: () => {
      refetchDishes();
    },
    onSettled: () => {
      setTogglingDishId(null);
    },
  });

  // Delete dish mutation
  const deleteMutation = api.menu.delete.useMutation({
    onSuccess: () => {
      setModalState("none");
      setSelectedDish(null);
      refetchDishes();
      refetchCategories();
    },
  });

  const handleDishClick = (dish: DishData) => {
    router.push(`/${locale}/${tenantSlug}/menu/${dish.id}`);
  };

  const handleToggleAvailable = (id: string) => {
    toggleMutation.mutate({ id });
  };

  const handleCreateSubmit = (data: DishFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: DishFormData) => {
    if (!selectedDish) return;
    updateMutation.mutate({
      id: selectedDish.id,
      ...data,
    });
  };

  const handleDelete = () => {
    if (!selectedDish) return;
    deleteMutation.mutate({ id: selectedDish.id });
  };

  const openEditModal = (dish: DishData) => {
    setSelectedDish(dish);
    setModalState("edit");
  };

  const openDeleteModal = (dish: DishData) => {
    setSelectedDish(dish);
    setModalState("delete");
  };

  // Transform categories for CategoryList component
  const categoryListData = categories.map((c) => ({
    ...c,
    dishCount: c._count?.dishes ?? c.dishCount ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary-dark tracking-tight">
            {t.title}
          </h1>
          <p className="text-text-secondary mt-1">
            {stats.total} dish{stats.total !== 1 ? "es" : ""} total,{" "}
            {stats.available} available
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Manage categories button */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/${tenantSlug}/menu/categories`)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
              "bg-surface-dark border border-separator text-text-secondary",
              "hover:bg-hover-row hover:text-text-primary-dark"
            )}
          >
            <span className="material-symbols-outlined text-lg">category</span>
            {t.categories}
          </button>

          {/* Add dish button */}
          <button
            type="button"
            onClick={() => setModalState("create")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm",
              "bg-primary text-white",
              "hover:bg-primary-dark",
              "shadow-lg shadow-primary/20"
            )}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t.addDish}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.available}
            </span>
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.available}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.unavailable}
            </span>
            <span className="w-3 h-3 rounded-full bg-gray-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.unavailable}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.outOfStock}
            </span>
            <span className="w-3 h-3 rounded-full bg-red-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.outOfStock}
          </p>
        </div>

        <div className="bg-card-dark rounded-xl border border-separator p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              {t.categories}
            </span>
            <span className="material-symbols-outlined text-lg text-text-muted">
              category
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary-dark">
            {stats.categories}
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-card-dark rounded-xl border border-separator p-4 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={cn(
              "w-full h-10 pl-10 pr-4 rounded-lg",
              "bg-surface-dark border border-separator text-text-primary-dark",
              "placeholder:text-text-muted",
              "focus:outline-none focus:border-primary/50"
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary-dark"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Category tabs */}
        <CategoryList
          categories={categoryListData}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          layout="tabs"
          showAll={true}
          allLabel={t.allCategories}
          totalDishCount={stats.total}
          locale={locale}
        />
      </div>

      {/* Dishes grid */}
      <div className="bg-card-dark rounded-xl border border-separator p-6">
        <DishGrid
          dishes={dishes}
          selectedCategoryId={selectedCategoryId}
          searchQuery={searchQuery}
          onDishClick={handleDishClick}
          onToggleAvailable={handleToggleAvailable}
          togglingDishId={togglingDishId ?? undefined}
          locale={locale}
        />
      </div>

      {/* Create dish modal */}
      {modalState === "create" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState("none")}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-surface-dark rounded-xl border border-separator shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                {t.addDish}
              </h2>
              <button
                type="button"
                onClick={() => setModalState("none")}
                className="p-1 text-text-muted hover:text-text-primary-dark rounded-lg hover:bg-hover-row"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <DishForm
                categories={categories}
                onSubmit={handleCreateSubmit}
                onCancel={() => setModalState("none")}
                isLoading={createMutation.isPending}
              />
            </div>

            {createMutation.error && (
              <div className="px-6 pb-6">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    {createMutation.error.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit dish modal */}
      {modalState === "edit" && selectedDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState("none")}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-surface-dark rounded-xl border border-separator shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
              <h2 className="text-lg font-semibold text-text-primary-dark">
                {t.editDish}
              </h2>
              <button
                type="button"
                onClick={() => setModalState("none")}
                className="p-1 text-text-muted hover:text-text-primary-dark rounded-lg hover:bg-hover-row"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <DishForm
                dish={selectedDish}
                categories={categories}
                onSubmit={handleEditSubmit}
                onCancel={() => setModalState("none")}
                isLoading={updateMutation.isPending}
              />
            </div>

            {updateMutation.error && (
              <div className="px-6 pb-6">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    {updateMutation.error.message}
                  </p>
                </div>
              </div>
            )}

            {/* Delete button in edit modal */}
            <div className="px-6 pb-6 pt-2 border-t border-separator">
              <button
                type="button"
                onClick={() => openDeleteModal(selectedDish)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-red-500/10 text-red-400 border border-red-500/20",
                  "hover:bg-red-500/20"
                )}
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {modalState === "delete" && selectedDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalState("none")}
          />

          {/* Modal */}
          <div className="relative w-full max-w-sm bg-surface-dark rounded-xl border border-separator shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-500/10">
                <span className="material-symbols-outlined text-3xl text-error">
                  delete
                </span>
              </div>
              <h2 className="text-lg font-semibold text-text-primary-dark mb-2">
                Delete {selectedDish.name}?
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                {t.confirmDelete}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalState("none")}
                  disabled={deleteMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm",
                    "bg-surface-dark border border-separator text-text-secondary",
                    "hover:bg-hover-row hover:text-text-primary-dark",
                    "disabled:opacity-50"
                  )}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg font-bold text-sm",
                    "bg-error text-white",
                    "hover:bg-red-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2"
                  )}
                >
                  {deleteMutation.isPending && (
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                  )}
                  {t.delete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuPageClient;
