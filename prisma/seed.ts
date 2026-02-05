/**
 * Database Seed Script
 *
 * Creates test data for development:
 * - Test tenant (demo-restaurant)
 * - Admin user (admin@demo.com / password123)
 * - Waiter user (waiter@demo.com / password123)
 * - Cook user (cook@demo.com / password123)
 * - Settings, prep sectors, categories, dishes, tables
 */

import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.resolve(__dirname, "../.env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma client with adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // Clean existing data (in reverse order of dependencies)
  console.log("Cleaning existing data...");
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.table.deleteMany();
  await prisma.dishIngredient.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();
  await prisma.prepSector.deleteMany();
  await prisma.product.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create tenant
  console.log("Creating tenant...");
  const tenant = await prisma.tenant.create({
    data: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      email: "info@demo-restaurant.com",
      phone: "+34 612 345 678",
      address: "Calle Mayor 123, Madrid",
      plan: "PROFESSIONAL",
    },
  });

  // Create settings
  console.log("Creating settings...");
  await prisma.settings.create({
    data: {
      tenantId: tenant.id,
      vatRate: 10,
      currency: "EUR",
      tipEnabled: true,
      tipPercentages: [0, 5, 10, 15],
    },
  });

  // Create prep sectors
  console.log("Creating prep sectors...");
  const kitchenSector = await prisma.prepSector.create({
    data: {
      tenantId: tenant.id,
      name: "Cocina",
      code: "KITCHEN",
    },
  });

  const barSector = await prisma.prepSector.create({
    data: {
      tenantId: tenant.id,
      name: "Bar",
      code: "BAR",
    },
  });

  // Create users
  console.log("Creating users...");
  const passwordHash = await hash("password123", 12);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@demo.com",
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "waiter@demo.com",
      name: "Carlos Camarero",
      passwordHash,
      role: "WAITER",
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "cook@demo.com",
      name: "María Cocinera",
      passwordHash,
      role: "COOK",
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "bartender@demo.com",
      name: "Luis Barman",
      passwordHash,
      role: "BARTENDER",
    },
  });

  // Create categories
  console.log("Creating categories...");
  const tapasCategory = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Tapas",
      nameEn: "Tapas",
      displayOrder: 1,
      prepSectorId: kitchenSector.id,
    },
  });

  const mainCategory = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Platos Principales",
      nameEn: "Main Courses",
      displayOrder: 2,
      prepSectorId: kitchenSector.id,
    },
  });

  const drinksCategory = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Bebidas",
      nameEn: "Drinks",
      displayOrder: 3,
      prepSectorId: barSector.id,
    },
  });

  const dessertsCategory = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: "Postres",
      nameEn: "Desserts",
      displayOrder: 4,
      prepSectorId: kitchenSector.id,
    },
  });

  // Create dishes
  console.log("Creating dishes...");
  const dishes = [
    // Tapas
    {
      name: "Patatas Bravas",
      nameEn: "Spicy Potatoes",
      description: "Patatas fritas con salsa brava picante",
      descriptionEn: "Fried potatoes with spicy brava sauce",
      price: 6.5,
      categoryId: tapasCategory.id,
      allergens: [],
      displayOrder: 1,
    },
    {
      name: "Croquetas de Jamón",
      nameEn: "Ham Croquettes",
      description: "6 croquetas caseras de jamón ibérico",
      descriptionEn: "6 homemade Iberian ham croquettes",
      price: 8.0,
      categoryId: tapasCategory.id,
      allergens: ["gluten", "dairy", "eggs"],
      displayOrder: 2,
    },
    {
      name: "Tortilla Española",
      nameEn: "Spanish Omelette",
      description: "Tortilla de patata tradicional",
      descriptionEn: "Traditional potato omelette",
      price: 7.5,
      categoryId: tapasCategory.id,
      allergens: ["eggs"],
      displayOrder: 3,
    },
    {
      name: "Gambas al Ajillo",
      nameEn: "Garlic Shrimp",
      description: "Gambas salteadas con ajo y guindilla",
      descriptionEn: "Shrimp sautéed with garlic and chili",
      price: 12.0,
      categoryId: tapasCategory.id,
      allergens: ["shellfish"],
      displayOrder: 4,
    },
    // Main courses
    {
      name: "Paella Valenciana",
      nameEn: "Valencian Paella",
      description: "Arroz con pollo, conejo y verduras",
      descriptionEn: "Rice with chicken, rabbit and vegetables",
      price: 16.0,
      categoryId: mainCategory.id,
      allergens: [],
      displayOrder: 1,
    },
    {
      name: "Entrecot a la Brasa",
      nameEn: "Grilled Ribeye",
      description: "300g de entrecot con patatas y pimientos",
      descriptionEn: "300g ribeye with potatoes and peppers",
      price: 22.0,
      categoryId: mainCategory.id,
      allergens: [],
      displayOrder: 2,
    },
    {
      name: "Merluza a la Vasca",
      nameEn: "Basque-Style Hake",
      description: "Merluza con salsa verde y almejas",
      descriptionEn: "Hake with green sauce and clams",
      price: 18.5,
      categoryId: mainCategory.id,
      allergens: ["fish", "shellfish"],
      displayOrder: 3,
    },
    // Drinks
    {
      name: "Cerveza Caña",
      nameEn: "Draft Beer",
      description: "Cerveza de barril (200ml)",
      descriptionEn: "Draft beer (200ml)",
      price: 2.5,
      categoryId: drinksCategory.id,
      allergens: ["gluten"],
      displayOrder: 1,
    },
    {
      name: "Tinto de Verano",
      nameEn: "Summer Red Wine",
      description: "Vino tinto con gaseosa de limón",
      descriptionEn: "Red wine with lemon soda",
      price: 3.0,
      categoryId: drinksCategory.id,
      allergens: [],
      displayOrder: 2,
    },
    {
      name: "Sangría (Jarra)",
      nameEn: "Sangria (Pitcher)",
      description: "Jarra de sangría casera (1L)",
      descriptionEn: "Homemade sangria pitcher (1L)",
      price: 12.0,
      categoryId: drinksCategory.id,
      allergens: [],
      displayOrder: 3,
    },
    {
      name: "Agua Mineral",
      nameEn: "Mineral Water",
      description: "Botella de agua (500ml)",
      descriptionEn: "Water bottle (500ml)",
      price: 2.0,
      categoryId: drinksCategory.id,
      allergens: [],
      displayOrder: 4,
    },
    // Desserts
    {
      name: "Crema Catalana",
      nameEn: "Catalan Cream",
      description: "Crema con costra de caramelo",
      descriptionEn: "Cream with caramelized sugar crust",
      price: 5.5,
      categoryId: dessertsCategory.id,
      allergens: ["dairy", "eggs"],
      displayOrder: 1,
    },
    {
      name: "Flan Casero",
      nameEn: "Homemade Flan",
      description: "Flan de huevo con caramelo",
      descriptionEn: "Egg custard with caramel",
      price: 4.5,
      categoryId: dessertsCategory.id,
      allergens: ["dairy", "eggs"],
      displayOrder: 2,
    },
  ];

  for (const dish of dishes) {
    await prisma.dish.create({
      data: {
        tenantId: tenant.id,
        ...dish,
      },
    });
  }

  // Create tables
  console.log("Creating tables...");
  const tables = [
    { number: 1, capacity: 2, zone: "Terraza" },
    { number: 2, capacity: 4, zone: "Terraza" },
    { number: 3, capacity: 4, zone: "Terraza" },
    { number: 4, capacity: 6, zone: "Interior" },
    { number: 5, capacity: 4, zone: "Interior" },
    { number: 6, capacity: 4, zone: "Interior" },
    { number: 7, capacity: 8, zone: "Privado" },
    { number: 8, capacity: 2, zone: "Barra" },
  ];

  for (const table of tables) {
    // Generate random 6-char QR code
    const qrCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await prisma.table.create({
      data: {
        tenantId: tenant.id,
        qrCode,
        ...table,
      },
    });
  }

  console.log("\n✅ Seed completed!\n");
  console.log("=".repeat(50));
  console.log("TEST CREDENTIALS:");
  console.log("=".repeat(50));
  console.log("Restaurant: demo-restaurant");
  console.log("");
  console.log("Admin:      admin@demo.com / password123");
  console.log("Waiter:     waiter@demo.com / password123");
  console.log("Cook:       cook@demo.com / password123");
  console.log("Bartender:  bartender@demo.com / password123");
  console.log("=".repeat(50));
  console.log("\nLogin URL: http://localhost:3000/es/login");
  console.log("");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
