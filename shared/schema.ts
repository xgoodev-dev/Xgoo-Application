import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Offices table - one office per account for MVP
export const offices = pgTable("offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  gstNumber: varchar("gst_number", { length: 20 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  publicSlug: varchar("public_slug", { length: 50 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_offices_slug").on(table.publicSlug),
]);

export const officesRelations = relations(offices, ({ many }) => ({
  customers: many(customers),
  courierPartners: many(courierPartners),
  shipments: many(shipments),
}));

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").notNull().references(() => offices.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  gstNumber: varchar("gst_number", { length: 20 }),
  customerType: varchar("customer_type", { length: 20 }).notNull().default("walk_in"), // walk_in, business
  paymentType: varchar("payment_type", { length: 20 }).notNull().default("prepaid"), // prepaid, credit
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).default("0"),
  creditBalance: decimal("credit_balance", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_customers_office").on(table.officeId),
  index("idx_customers_phone").on(table.phone),
]);

export const customersRelations = relations(customers, ({ one, many }) => ({
  office: one(offices, {
    fields: [customers.officeId],
    references: [offices.id],
  }),
  shipments: many(shipments),
}));

// Courier Partners table
export const courierPartners = pgTable("courier_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").notNull().references(() => offices.id),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  baseRateAir: decimal("base_rate_air", { precision: 10, scale: 2 }).default("0"),
  baseRateSurface: decimal("base_rate_surface", { precision: 10, scale: 2 }).default("0"),
  ratePerKgAir: decimal("rate_per_kg_air", { precision: 10, scale: 2 }).default("0"),
  ratePerKgSurface: decimal("rate_per_kg_surface", { precision: 10, scale: 2 }).default("0"),
  awbPrefix: varchar("awb_prefix", { length: 20 }),
  awbRangeStart: varchar("awb_range_start", { length: 50 }),
  awbRangeEnd: varchar("awb_range_end", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_courier_partners_office").on(table.officeId),
]);

export const courierPartnersRelations = relations(courierPartners, ({ one, many }) => ({
  office: one(offices, {
    fields: [courierPartners.officeId],
    references: [offices.id],
  }),
  shipments: many(shipments),
}));

// Shipments table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").notNull().references(() => offices.id),
  customerId: varchar("customer_id").references(() => customers.id),
  courierPartnerId: varchar("courier_partner_id").references(() => courierPartners.id),
  bookingNumber: varchar("booking_number", { length: 50 }).notNull(),
  awbNumber: varchar("awb_number", { length: 100 }),
  
  // Sender details
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  senderPhone: varchar("sender_phone", { length: 20 }).notNull(),
  senderAddress: text("sender_address").notNull(),
  senderCity: varchar("sender_city", { length: 100 }),
  senderState: varchar("sender_state", { length: 100 }),
  senderPincode: varchar("sender_pincode", { length: 10 }),
  
  // Receiver details
  receiverName: varchar("receiver_name", { length: 255 }).notNull(),
  receiverPhone: varchar("receiver_phone", { length: 20 }).notNull(),
  receiverAddress: text("receiver_address").notNull(),
  receiverCity: varchar("receiver_city", { length: 100 }),
  receiverState: varchar("receiver_state", { length: 100 }),
  receiverPincode: varchar("receiver_pincode", { length: 10 }),
  
  // Package details
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  length: decimal("length", { precision: 10, scale: 2 }),
  width: decimal("width", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 10, scale: 2 }),
  volumetricWeight: decimal("volumetric_weight", { precision: 10, scale: 2 }),
  chargeableWeight: decimal("chargeable_weight", { precision: 10, scale: 2 }),
  numberOfPieces: integer("number_of_pieces").default(1),
  contentDescription: text("content_description"),
  declaredValue: decimal("declared_value", { precision: 12, scale: 2 }),
  
  // Service details
  serviceType: varchar("service_type", { length: 20 }).notNull().default("surface"), // air, surface
  status: varchar("status", { length: 30 }).notNull().default("booked"), // booked, picked_up, in_transit, delivered
  
  // Billing
  baseAmount: decimal("base_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  additionalCharges: decimal("additional_charges", { precision: 12, scale: 2 }).default("0"),
  gstAmount: decimal("gst_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  
  bookedAt: timestamp("booked_at").defaultNow(),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_shipments_office").on(table.officeId),
  index("idx_shipments_customer").on(table.customerId),
  index("idx_shipments_partner").on(table.courierPartnerId),
  index("idx_shipments_booking").on(table.bookingNumber),
  index("idx_shipments_awb").on(table.awbNumber),
  index("idx_shipments_status").on(table.status),
  index("idx_shipments_booked_at").on(table.bookedAt),
]);

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  office: one(offices, {
    fields: [shipments.officeId],
    references: [offices.id],
  }),
  customer: one(customers, {
    fields: [shipments.customerId],
    references: [customers.id],
  }),
  courierPartner: one(courierPartners, {
    fields: [shipments.courierPartnerId],
    references: [courierPartners.id],
  }),
  payments: many(payments),
  invoice: one(invoices),
}));

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMode: varchar("payment_mode", { length: 30 }).notNull(), // cash, upi, bank_transfer, credit
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"), // pending, completed, failed
  transactionReference: varchar("transaction_reference", { length: 100 }),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_payments_shipment").on(table.shipmentId),
  index("idx_payments_status").on(table.paymentStatus),
]);

export const paymentsRelations = relations(payments, ({ one }) => ({
  shipment: one(shipments, {
    fields: [payments.shipmentId],
    references: [shipments.id],
  }),
}));

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull().references(() => shipments.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  invoiceDate: timestamp("invoice_date").defaultNow(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  gstAmount: decimal("gst_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  pdfUrl: varchar("pdf_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_invoices_shipment").on(table.shipmentId),
  index("idx_invoices_number").on(table.invoiceNumber),
]);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  shipment: one(shipments, {
    fields: [invoices.shipmentId],
    references: [shipments.id],
  }),
}));

// Quotations table
export const quotations = pgTable("quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").notNull().references(() => offices.id),
  quotationNumber: varchar("quotation_number", { length: 50 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  
  // Sender details
  senderCity: varchar("sender_city", { length: 100 }),
  senderState: varchar("sender_state", { length: 100 }),
  senderPincode: varchar("sender_pincode", { length: 10 }),
  
  // Receiver details
  receiverCity: varchar("receiver_city", { length: 100 }),
  receiverState: varchar("receiver_state", { length: 100 }),
  receiverPincode: varchar("receiver_pincode", { length: 10 }),
  
  // Package details
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  numberOfPieces: integer("number_of_pieces").default(1),
  contentDescription: text("content_description"),
  declaredValue: decimal("declared_value", { precision: 12, scale: 2 }),
  
  // Service details
  serviceType: varchar("service_type", { length: 20 }).notNull().default("surface"),
  courierPartnerId: varchar("courier_partner_id").references(() => courierPartners.id),
  
  // Pricing
  baseAmount: decimal("base_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  additionalCharges: decimal("additional_charges", { precision: 12, scale: 2 }).default("0"),
  gstAmount: decimal("gst_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, accepted, rejected, expired
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_quotations_office").on(table.officeId),
  index("idx_quotations_number").on(table.quotationNumber),
  index("idx_quotations_status").on(table.status),
]);

export const quotationsRelations = relations(quotations, ({ one }) => ({
  office: one(offices, {
    fields: [quotations.officeId],
    references: [offices.id],
  }),
  courierPartner: one(courierPartners, {
    fields: [quotations.courierPartnerId],
    references: [courierPartners.id],
  }),
}));

// Booking Requests table - for public booking submissions
export const bookingRequests = pgTable("booking_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").notNull().references(() => offices.id),
  requestNumber: varchar("request_number", { length: 50 }).notNull(),
  
  // Sender details
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  senderPhone: varchar("sender_phone", { length: 20 }).notNull(),
  senderEmail: varchar("sender_email", { length: 255 }),
  senderAddress: text("sender_address").notNull(),
  senderCity: varchar("sender_city", { length: 100 }),
  senderState: varchar("sender_state", { length: 100 }),
  senderPincode: varchar("sender_pincode", { length: 10 }),
  
  // Receiver details
  receiverName: varchar("receiver_name", { length: 255 }).notNull(),
  receiverPhone: varchar("receiver_phone", { length: 20 }).notNull(),
  receiverAddress: text("receiver_address").notNull(),
  receiverCity: varchar("receiver_city", { length: 100 }),
  receiverState: varchar("receiver_state", { length: 100 }),
  receiverPincode: varchar("receiver_pincode", { length: 10 }),
  
  // Package details
  weight: decimal("weight", { precision: 10, scale: 2 }),
  numberOfPieces: integer("number_of_pieces").default(1),
  contentDescription: text("content_description"),
  declaredValue: decimal("declared_value", { precision: 12, scale: 2 }),
  
  // Service preference
  serviceType: varchar("service_type", { length: 20 }).default("surface"),
  courierPreference: varchar("courier_preference", { length: 255 }),
  
  // Pickup location
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }),
  pickupLocationName: varchar("pickup_location_name", { length: 500 }),
  
  // Customer user link
  customerUserId: varchar("customer_user_id").references(() => customerUsers.id),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, reviewed, approved, rejected, converted
  notes: text("notes"),
  convertedShipmentId: varchar("converted_shipment_id").references(() => shipments.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => [
  index("idx_booking_requests_office").on(table.officeId),
  index("idx_booking_requests_status").on(table.status),
  index("idx_booking_requests_number").on(table.requestNumber),
  index("idx_booking_requests_customer_user").on(table.customerUserId),
]);

export const bookingRequestsRelations = relations(bookingRequests, ({ one }) => ({
  office: one(offices, {
    fields: [bookingRequests.officeId],
    references: [offices.id],
  }),
  convertedShipment: one(shipments, {
    fields: [bookingRequests.convertedShipmentId],
    references: [shipments.id],
  }),
}));

// Customer Users table - for public portal registration
export const customerUsers = pgTable("customer_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").notNull().references(() => offices.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 10 }),
  defaultPickupLat: decimal("default_pickup_lat", { precision: 10, scale: 7 }),
  defaultPickupLng: decimal("default_pickup_lng", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_customer_users_office").on(table.officeId),
  index("idx_customer_users_phone").on(table.phone),
  index("idx_customer_users_email").on(table.email),
]);

export const customerUsersRelations = relations(customerUsers, ({ one, many }) => ({
  office: one(offices, {
    fields: [customerUsers.officeId],
    references: [offices.id],
  }),
}));

// Customer Sessions table
export const customerSessions = pgTable("customer_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerUserId: varchar("customer_user_id").notNull().references(() => customerUsers.id),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_customer_sessions_token").on(table.token),
  index("idx_customer_sessions_user").on(table.customerUserId),
]);

export const customerSessionsRelations = relations(customerSessions, ({ one }) => ({
  customerUser: one(customerUsers, {
    fields: [customerSessions.customerUserId],
    references: [customerUsers.id],
  }),
}));

// Insert schemas
export const insertOfficeSchema = createInsertSchema(offices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourierPartnerSchema = createInsertSchema(courierPartners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  bookingNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  quotationNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingRequestSchema = createInsertSchema(bookingRequests).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertCustomerUserSchema = createInsertSchema(customerUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSessionSchema = createInsertSchema(customerSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type Office = typeof offices.$inferSelect;
export type InsertOffice = z.infer<typeof insertOfficeSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type CourierPartner = typeof courierPartners.$inferSelect;
export type InsertCourierPartner = z.infer<typeof insertCourierPartnerSchema>;

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;

export type BookingRequest = typeof bookingRequests.$inferSelect;
export type InsertBookingRequest = z.infer<typeof insertBookingRequestSchema>;

export type CustomerUser = typeof customerUsers.$inferSelect;
export type InsertCustomerUser = z.infer<typeof insertCustomerUserSchema>;

export type CustomerSession = typeof customerSessions.$inferSelect;
export type InsertCustomerSession = z.infer<typeof insertCustomerSessionSchema>;

// Extended types for frontend use
export type ShipmentWithRelations = Shipment & {
  customer?: Customer | null;
  courierPartner?: CourierPartner | null;
  payments?: Payment[];
  invoice?: Invoice | null;
};
