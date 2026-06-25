import { z } from "zod";

export const washVehicleClassSchema = z.enum(["compact", "suv", "van", "luxury", "truck", "bike"]);

/** Matches server `LocationResponse` (GET /locations). */
export const locationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  addressLine1: z.string(),
  city: z.string(),
  region: z.string(),
  postalCode: z.string(),
  country: z.string(),
  bookingTimeZone: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Matches server `WashPackageResponse` (GET /wash-packages). */
export const washPackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  priceCents: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  vehicleClass: washVehicleClassSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const vehicleSchema = z.object({
  id: z.string().uuid(),
  clerkUserId: z.string().nullable().optional(),
  nickname: z.string(),
  registration: z.string(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  vehicleClass: washVehicleClassSchema,
  loyaltyPoints: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const createVehicleSchema = z.object({
  nickname: z.string().max(128).optional().default(""),
  registration: z.string().trim().min(1).max(32),
  make: z.string().max(128).optional(),
  model: z.string().max(128).optional(),
  color: z.string().max(64).optional(),
  vehicleClass: washVehicleClassSchema.optional().default("compact"),
});

export const bookingPaymentTimingSchema = z.enum(["PAY_NOW", "PAY_AT_PICKUP"]);
export const bookingVisitStatusSchema = z.enum([
  "ARRIVED",
  "KEYS_RESERVED",
  "IN_SERVICE",
  "WASH_DONE",
  "READY_FOR_PICKUP",
  "COMPLETED",
]);

export const bookingPaymentStatusSchema = z.enum([
  "UNPAID",
  "PARTIAL",
  "PAID",
  "NOT_REQUIRED",
]);

export const bookingStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "SERVICED",
]);

/** Subset of linked vehicle on booking responses (matches server `bookingVehicleSummary`). */
export const bookingVehicleSummarySchema = z.object({
  id: z.string().uuid(),
  nickname: z.string(),
  registration: z.string(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  color: z.string().nullable(),
  vehicleClass: washVehicleClassSchema,
});

export const bookingSchema = z.object({
  id: z.string().uuid(),
  bookingCode: z.string(),
  status: bookingStatusSchema,
  visitStatus: bookingVisitStatusSchema,
  paymentTiming: bookingPaymentTimingSchema.nullable(),
  paymentStatus: bookingPaymentStatusSchema,
  scheduledAt: z.string(),
  notes: z.string(),
  washPackageName: z.string().nullable(),
  locationId: z.string().uuid().nullable(),
  vehicleId: z.string().uuid().nullable(),
  vehicle: bookingVehicleSummarySchema.nullish(),
  totalDueCents: z.number().int().nullable(),
  amountPaidCents: z.number().int().nullable(),
  outstandingCents: z.number().int().nullable(),
  loyaltyPointsRedeemed: z.number().int().optional(),
  loyaltyDiscountCents: z.number().int().optional(),
  loyaltyPointsEarned: z.number().int().nullable().optional(),
  vehicleAvailableLoyaltyPoints: z.number().int().optional(),
  totalUserLoyaltyPoints: z.number().int().optional(),
  keysReservedAt: z.string().nullable(),
  keysReleasedAt: z.string().nullable(),
  keyTag: z.string().nullable(),
  releaseLockedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const bookingListSchema = z.array(bookingSchema);
export const locationListSchema = z.array(locationSchema);
export const washPackageListSchema = z.array(washPackageSchema);
export const vehicleListSchema = z.array(vehicleSchema);

export const adminVehicleLookupResponseSchema = z.discriminatedUnion("found", [
  z.object({ found: z.literal(true), vehicle: vehicleSchema }),
  z.object({ found: z.literal(false) }),
]);

export type AdminVehicleLookupResponse = z.infer<
  typeof adminVehicleLookupResponseSchema
>;

export const washPackageLineItemSchema = z.object({
  washPackageId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const createWalkInBookingSchema = z.object({
  vehicleRegistration: z.string().trim().min(1).max(32),
  paymentTiming: bookingPaymentTimingSchema,
  notes: z.string().max(2000).optional(),
  washPackageLineItems: z.array(washPackageLineItemSchema).min(1).max(32),
  locationId: z.string().uuid().optional(),
  loyaltyRedeemBlocks: z.number().int().min(0).max(5).optional(),
});

export const adminWalkInBookingSchema = createWalkInBookingSchema.extend({
  customerCellNumber: z.string().trim().min(7).max(32),
});

export const reserveKeysBodySchema = z.object({
  keyTag: z.string().trim().min(1).max(64).optional(),
  keyLockerSlot: z.string().trim().min(1).max(64).optional(),
});

export const releaseRequestBodySchema = z.object({
  bookingCode: z.string().trim().min(4).max(12),
});

export const releaseConfirmBodySchema = z.object({
  bookingCode: z.string().trim().min(4).max(12),
  pin: z.string().regex(/^\d{6}$/),
});

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Expected HH:MM or HH:MM:SS");

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const repeatTypeSchema = z.enum(["none", "daily", "weekly", "custom"]);
export const deviceTargetModeSchema = z.enum(["all", "include", "exclude"]);
export const schedulePrioritySchema = z.enum(["low", "medium", "high"]);

function parseTimeToMinutes(time: string): number {
  const parts = time.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

export const createPlaylistScheduleFormSchema = z
  .object({
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    startDate: dateStringSchema,
    endDate: z.string().optional(),
    repeatType: repeatTypeSchema.default("daily"),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
    timezone: z.string().min(1).default("UTC"),
    priority: schedulePrioritySchema.default("medium"),
    enabled: z.boolean().default(true),
    loopPlaylist: z.boolean().default(true),
    deviceTargetMode: deviceTargetModeSchema.default("all"),
    deviceIds: z.array(z.string().min(1)).default([]),
  })
  .superRefine((data, ctx) => {
    const startMinutes = parseTimeToMinutes(data.startTime);
    const endMinutes = parseTimeToMinutes(data.endTime);
    if (startMinutes === endMinutes) {
      ctx.addIssue({
        code: "custom",
        message: "Start and end time cannot be the same",
        path: ["endTime"],
      });
    }

    const trimmedEndDate = data.endDate?.trim();
    if (trimmedEndDate && trimmedEndDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be on or after start date",
        path: ["endDate"],
      });
    }

    if (
      (data.repeatType === "weekly" || data.repeatType === "custom") &&
      data.daysOfWeek.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one day",
        path: ["daysOfWeek"],
      });
    }

    if (
      (data.deviceTargetMode === "include" ||
        data.deviceTargetMode === "exclude") &&
      data.deviceIds.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one device",
        path: ["deviceIds"],
      });
    }
  });

export const createPlaylistFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  locationId: z.string().uuid().nullable().optional(),
  schedule: createPlaylistScheduleFormSchema,
});

export type CreatePlaylistScheduleFormValues = z.infer<
  typeof createPlaylistScheduleFormSchema
>;
export type CreatePlaylistFormValues = z.infer<typeof createPlaylistFormSchema>;

export type Location = z.infer<typeof locationSchema>;
export type WashPackage = z.infer<typeof washPackageSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type CreateVehicleBody = z.infer<typeof createVehicleSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type CreateWalkInBookingBody = z.infer<typeof createWalkInBookingSchema>;
export type AdminWalkInBookingBody = z.infer<typeof adminWalkInBookingSchema>;
