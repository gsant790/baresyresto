import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma, PaymentMethod, PaymentStatus } from "@prisma/client";
import {
  router,
  protectedProcedure,
  requirePermission,
} from "@/lib/trpc/init";
import { prisma } from "@/lib/db";

/**
 * Payments Router
 *
 * Handles payment operations for orders.
 * Supports manual payment methods (CASH, CARD) and Bizum payments.
 *
 * Permissions:
 * - ADMIN, SUPER_ADMIN: Full access (view, process, refund)
 * - WAITER: View and process payments
 * - COOK, BARTENDER: No access
 */

// Validation schemas
const createPaymentSchema = z.object({
  orderId: z.string().cuid("Invalid order ID"),
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive("Amount must be positive"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const initiateRedsysSchema = z.object({
  orderId: z.string().cuid("Invalid order ID"),
  returnUrl: z.string().url("Invalid return URL"),
  cancelUrl: z.string().url("Invalid cancel URL"),
});

const handleWebhookSchema = z.object({
  Ds_MerchantParameters: z.string(),
  Ds_Signature: z.string(),
  Ds_SignatureVersion: z.string(),
});

export const paymentsRouter = router({
  /**
   * Create a payment record for an order.
   * Used for manual payments (CASH, CARD).
   */
  createPayment: protectedProcedure
    .use(requirePermission("payments", "process"))
    .input(createPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;
      const userId = ctx.session.user.id;

      // Verify the order exists and belongs to this tenant
      const order = await prisma.order.findFirst({
        where: {
          id: input.orderId,
          tenantId,
        },
        include: {
          payment: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Check if payment already exists
      if (order.payment) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Payment already exists for this order",
        });
      }

      // Verify order status allows payment
      if (order.status === "PAID") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order is already paid",
        });
      }

      if (order.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot process payment for cancelled order",
        });
      }

      // For CASH and CARD, payment is immediately completed
      const isManualPayment = input.method === "CASH" || input.method === "CARD";
      const paymentStatus: PaymentStatus = isManualPayment ? "COMPLETED" : "PENDING";

      // Create payment in a transaction
      const payment = await prisma.$transaction(async (tx) => {
        // Create the payment record
        const newPayment = await tx.payment.create({
          data: {
            tenantId,
            orderId: input.orderId,
            method: input.method,
            status: paymentStatus,
            amount: new Prisma.Decimal(input.amount),
            paidAt: isManualPayment ? new Date() : null,
            metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          },
        });

        // If manual payment, update order status to PAID
        if (isManualPayment) {
          await tx.order.update({
            where: { id: input.orderId },
            data: {
              status: "PAID",
              closedById: userId,
              closedAt: new Date(),
            },
          });

          // Create status history entry
          await tx.orderStatusHistory.create({
            data: {
              orderId: input.orderId,
              fromStatus: order.status,
              toStatus: "PAID",
              changedBy: userId,
              notes: `Payment processed via ${input.method}`,
            },
          });
        }

        return newPayment;
      });

      return {
        ...payment,
        amount: payment.amount.toNumber(),
      };
    }),

  /**
   * Get payment details for an order.
   */
  getPaymentByOrder: protectedProcedure
    .use(requirePermission("payments", "view"))
    .input(z.object({ orderId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const payment = await prisma.payment.findFirst({
        where: {
          orderId: input.orderId,
          tenantId,
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
              table: {
                select: {
                  id: true,
                  number: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        return null;
      }

      return {
        ...payment,
        amount: payment.amount.toNumber(),
        order: {
          ...payment.order,
          total: payment.order.total.toNumber(),
        },
      };
    }),

  /**
   * Get all payments for the tenant.
   * Supports filtering by date range and status.
   */
  list: protectedProcedure
    .use(requirePermission("payments", "view"))
    .input(
      z.object({
        status: z.nativeEnum(PaymentStatus).optional(),
        method: z.nativeEnum(PaymentMethod).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const payments = await prisma.payment.findMany({
        where: {
          tenantId,
          ...(input.status && { status: input.status }),
          ...(input.method && { method: input.method }),
          ...(input.startDate && { createdAt: { gte: input.startDate } }),
          ...(input.endDate && { createdAt: { lte: input.endDate } }),
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              table: {
                select: {
                  id: true,
                  number: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      return payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toNumber(),
      }));
    }),

  /**
   * Initiate a Redsys/Bizum payment.
   * Returns the form data needed to redirect to Redsys.
   *
   * NOTE: This is a stub implementation. In production, you would:
   * 1. Configure Redsys merchant credentials in environment variables
   * 2. Generate proper signature using HMAC-SHA256
   * 3. Return the actual Redsys endpoint URL
   */
  initiateRedsys: protectedProcedure
    .use(requirePermission("payments", "process"))
    .input(initiateRedsysSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      // Verify the order exists
      const order = await prisma.order.findFirst({
        where: {
          id: input.orderId,
          tenantId,
        },
        include: {
          payment: true,
          tenant: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.payment) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Payment already exists for this order",
        });
      }

      // Create pending payment record for Bizum
      const payment = await prisma.payment.create({
        data: {
          tenantId,
          orderId: input.orderId,
          method: "BIZUM",
          status: "PENDING",
          amount: order.total,
          metadata: {
            initiatedAt: new Date().toISOString(),
            returnUrl: input.returnUrl,
            cancelUrl: input.cancelUrl,
          },
        },
      });

      // STUB: In production, this would generate real Redsys form data
      // For now, return mock data that indicates the integration point
      const merchantCode = process.env.REDSYS_MERCHANT_CODE ?? "STUB_MERCHANT";
      const terminal = process.env.REDSYS_TERMINAL ?? "1";

      // Generate a unique order reference (Redsys requires max 12 chars)
      const orderReference = `${order.orderNumber}${Date.now().toString(36)}`.slice(0, 12).toUpperCase();

      return {
        paymentId: payment.id,
        // In production, this would be the actual Redsys URL
        redsysUrl: process.env.REDSYS_URL ?? "https://sis-t.redsys.es:25443/sis/realizarPago",
        formData: {
          Ds_SignatureVersion: "HMAC_SHA256_V1",
          Ds_MerchantParameters: Buffer.from(
            JSON.stringify({
              DS_MERCHANT_AMOUNT: Math.round(order.total.toNumber() * 100).toString(),
              DS_MERCHANT_CURRENCY: "978", // EUR
              DS_MERCHANT_MERCHANTCODE: merchantCode,
              DS_MERCHANT_TERMINAL: terminal,
              DS_MERCHANT_ORDER: orderReference,
              DS_MERCHANT_TRANSACTIONTYPE: "0",
              DS_MERCHANT_URLOK: input.returnUrl,
              DS_MERCHANT_URLKO: input.cancelUrl,
              DS_MERCHANT_MERCHANTNAME: order.tenant.name,
              DS_MERCHANT_PAYMETHODS: "z", // z = Bizum
            })
          ).toString("base64"),
          // STUB: In production, generate real signature
          Ds_Signature: "STUB_SIGNATURE_REPLACE_WITH_REAL_HMAC_SHA256",
        },
        // Flag indicating this is a stub
        isStub: !process.env.REDSYS_MERCHANT_CODE,
      };
    }),

  /**
   * Handle Redsys webhook callback.
   * Called by Redsys to notify payment result.
   *
   * NOTE: This is a stub implementation. In production, you would:
   * 1. Verify the signature using your secret key
   * 2. Parse the merchant parameters
   * 3. Update the payment and order status accordingly
   */
  handleWebhook: protectedProcedure
    .input(handleWebhookSchema)
    .mutation(async ({ input }) => {
      // STUB: In production, verify signature first
      // const isValidSignature = verifyRedsysSignature(input);
      // if (!isValidSignature) {
      //   throw new TRPCError({
      //     code: "UNAUTHORIZED",
      //     message: "Invalid signature",
      //   });
      // }

      // Parse merchant parameters
      let params: Record<string, string>;
      try {
        params = JSON.parse(
          Buffer.from(input.Ds_MerchantParameters, "base64").toString("utf-8")
        );
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid merchant parameters",
        });
      }

      const orderReference = params.Ds_Order;
      const responseCode = parseInt(params.Ds_Response || "9999", 10);
      const bizumReference = params.Ds_AuthorisationCode;

      // Find the payment by looking for metadata with matching order reference
      // In production, you would store the order reference in the payment record
      const payment = await prisma.payment.findFirst({
        where: {
          method: "BIZUM",
          status: "PENDING",
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      // Response codes 0000-0099 indicate success
      const isSuccess = responseCode >= 0 && responseCode <= 99;

      // Update payment and order in transaction
      const updatedPayment = await prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: isSuccess ? "COMPLETED" : "FAILED",
            bizumReference: isSuccess ? bizumReference : null,
            paidAt: isSuccess ? new Date() : null,
            metadata: {
              ...(payment.metadata as object || {}),
              responseCode,
              orderReference,
              processedAt: new Date().toISOString(),
            },
          },
        });

        if (isSuccess) {
          // Update order status
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              status: "PAID",
              closedAt: new Date(),
            },
          });

          // Create status history
          await tx.orderStatusHistory.create({
            data: {
              orderId: payment.orderId,
              fromStatus: payment.order.status,
              toStatus: "PAID",
              notes: `Bizum payment completed (Ref: ${bizumReference})`,
            },
          });
        }

        return updated;
      });

      return {
        success: isSuccess,
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
      };
    }),

  /**
   * Get payment statistics for the tenant.
   * Useful for dashboard and reporting.
   */
  getStats: protectedProcedure
    .use(requirePermission("payments", "view"))
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.session.user.tenantId;

      const dateFilter = {
        ...(input?.startDate && { createdAt: { gte: input.startDate } }),
        ...(input?.endDate && { createdAt: { lte: input.endDate } }),
      };

      // Get counts by status
      const [completed, pending, failed] = await Promise.all([
        prisma.payment.count({
          where: { tenantId, status: "COMPLETED", ...dateFilter },
        }),
        prisma.payment.count({
          where: { tenantId, status: "PENDING", ...dateFilter },
        }),
        prisma.payment.count({
          where: { tenantId, status: "FAILED", ...dateFilter },
        }),
      ]);

      // Get totals by method
      const paymentsByMethod = await prisma.payment.groupBy({
        by: ["method"],
        where: { tenantId, status: "COMPLETED", ...dateFilter },
        _sum: { amount: true },
        _count: true,
      });

      // Get total revenue
      const totalRevenue = await prisma.payment.aggregate({
        where: { tenantId, status: "COMPLETED", ...dateFilter },
        _sum: { amount: true },
      });

      return {
        counts: {
          completed,
          pending,
          failed,
          total: completed + pending + failed,
        },
        byMethod: paymentsByMethod.map((p) => ({
          method: p.method,
          count: p._count,
          total: p._sum.amount?.toNumber() ?? 0,
        })),
        totalRevenue: totalRevenue._sum.amount?.toNumber() ?? 0,
      };
    }),
});

export type PaymentsRouter = typeof paymentsRouter;
