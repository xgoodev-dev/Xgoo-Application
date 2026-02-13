import {
  offices,
  customers,
  courierPartners,
  shipments,
  payments,
  invoices,
  quotations,
  bookingRequests,
  customerUsers,
  customerSessions,
  type Office,
  type InsertOffice,
  type Customer,
  type InsertCustomer,
  type CourierPartner,
  type InsertCourierPartner,
  type Shipment,
  type InsertShipment,
  type Payment,
  type InsertPayment,
  type Invoice,
  type InsertInvoice,
  type Quotation,
  type InsertQuotation,
  type BookingRequest,
  type InsertBookingRequest,
  type CustomerUser,
  type InsertCustomerUser,
  type CustomerSession,
  type InsertCustomerSession,
  type ShipmentWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, count, sum, isNotNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Office operations
  getOfficeByUserId(userId: string): Promise<Office | undefined>;
  createOffice(office: InsertOffice): Promise<Office>;
  updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office | undefined>;

  // Customer operations
  getCustomersByOffice(officeId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Courier Partner operations
  getPartnersByOffice(officeId: string): Promise<CourierPartner[]>;
  getPartner(id: string): Promise<CourierPartner | undefined>;
  createPartner(partner: InsertCourierPartner): Promise<CourierPartner>;
  updatePartner(id: string, partner: Partial<InsertCourierPartner>): Promise<CourierPartner | undefined>;
  deletePartner(id: string): Promise<boolean>;

  // Shipment operations
  getShipmentsByOffice(officeId: string): Promise<ShipmentWithRelations[]>;
  getShipment(id: string): Promise<ShipmentWithRelations | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipmentStatus(id: string, status: string): Promise<Shipment | undefined>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByShipment(shipmentId: string): Promise<Payment | undefined>;

  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoiceByShipment(shipmentId: string): Promise<Invoice | undefined>;

  // Quotation operations
  getQuotationsByOffice(officeId: string): Promise<Quotation[]>;
  getQuotation(id: string): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: string): Promise<boolean>;

  // Booking Request operations
  getBookingRequestsByOffice(officeId: string): Promise<BookingRequest[]>;
  getBookingRequest(id: string): Promise<BookingRequest | undefined>;
  createBookingRequest(request: InsertBookingRequest): Promise<BookingRequest>;
  updateBookingRequestStatus(id: string, status: string, convertedShipmentId?: string): Promise<BookingRequest | undefined>;
  
  // Customer User operations
  getCustomerUserByPhone(officeId: string, phone: string): Promise<CustomerUser | undefined>;
  getCustomerUserByEmail(officeId: string, email: string): Promise<CustomerUser | undefined>;
  getCustomerUser(id: string): Promise<CustomerUser | undefined>;
  createCustomerUser(user: InsertCustomerUser): Promise<CustomerUser>;
  updateCustomerUser(id: string, data: Partial<InsertCustomerUser>): Promise<CustomerUser | undefined>;

  // Customer Session operations
  createCustomerSession(session: InsertCustomerSession): Promise<CustomerSession>;
  getCustomerSessionByToken(token: string): Promise<CustomerSession | undefined>;
  deleteCustomerSession(token: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<void>;

  // Customer booking requests (by customer user)
  getBookingRequestsByCustomerUser(customerUserId: string): Promise<BookingRequest[]>;

  // Office lookup
  getOfficeBySlug(slug: string): Promise<Office | undefined>;
  getPublicOffices(): Promise<Pick<Office, "id" | "name" | "city" | "state" | "pincode" | "phone" | "email" | "publicSlug">[]>;

  // Dashboard stats
  getDashboardStats(officeId: string): Promise<{
    todayBookings: number;
    todayRevenue: string;
    pendingPayments: string;
    monthlyBookings: number;
    monthlyRevenue: string;
    statusCounts: Record<string, number>;
  }>;

  // Reports
  getReportData(officeId: string, from: string, to: string): Promise<{
    dateWise: Array<{ date: string; bookings: number; revenue: string }>;
    customerWise: Array<{ customerId: string; customerName: string; bookings: number; revenue: string }>;
    partnerWise: Array<{ partnerId: string; partnerName: string; bookings: number; revenue: string }>;
    summary: { totalBookings: number; totalRevenue: string; avgBookingValue: string; topPartner: string; topCustomer: string };
  }>;

  // Seed data
  seedData(officeId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Office operations
  async getOfficeByUserId(userId: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.userId, userId));
    return office;
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    const [created] = await db.insert(offices).values(office).returning();
    return created;
  }

  async updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office | undefined> {
    const [updated] = await db
      .update(offices)
      .set({ ...office, updatedAt: new Date() })
      .where(eq(offices.id, id))
      .returning();
    return updated;
  }

  // Customer operations
  async getCustomersByOffice(officeId: string): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.officeId, officeId)).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  // Courier Partner operations
  async getPartnersByOffice(officeId: string): Promise<CourierPartner[]> {
    return db.select().from(courierPartners).where(eq(courierPartners.officeId, officeId)).orderBy(desc(courierPartners.createdAt));
  }

  async getPartner(id: string): Promise<CourierPartner | undefined> {
    const [partner] = await db.select().from(courierPartners).where(eq(courierPartners.id, id));
    return partner;
  }

  async createPartner(partner: InsertCourierPartner): Promise<CourierPartner> {
    const [created] = await db.insert(courierPartners).values(partner).returning();
    return created;
  }

  async updatePartner(id: string, partner: Partial<InsertCourierPartner>): Promise<CourierPartner | undefined> {
    const [updated] = await db
      .update(courierPartners)
      .set({ ...partner, updatedAt: new Date() })
      .where(eq(courierPartners.id, id))
      .returning();
    return updated;
  }

  async deletePartner(id: string): Promise<boolean> {
    await db.delete(courierPartners).where(eq(courierPartners.id, id));
    return true;
  }

  // Shipment operations
  async getShipmentsByOffice(officeId: string): Promise<ShipmentWithRelations[]> {
    const results = await db
      .select()
      .from(shipments)
      .leftJoin(customers, eq(shipments.customerId, customers.id))
      .leftJoin(courierPartners, eq(shipments.courierPartnerId, courierPartners.id))
      .where(eq(shipments.officeId, officeId))
      .orderBy(desc(shipments.bookedAt));

    return results.map((row) => ({
      ...row.shipments,
      customer: row.customers,
      courierPartner: row.courier_partners,
    }));
  }

  async getShipment(id: string): Promise<ShipmentWithRelations | undefined> {
    const results = await db
      .select()
      .from(shipments)
      .leftJoin(customers, eq(shipments.customerId, customers.id))
      .leftJoin(courierPartners, eq(shipments.courierPartnerId, courierPartners.id))
      .where(eq(shipments.id, id));

    if (results.length === 0) return undefined;

    const row = results[0];
    return {
      ...row.shipments,
      customer: row.customers,
      courierPartner: row.courier_partners,
    };
  }

  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const bookingNumber = `XG${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const [created] = await db
      .insert(shipments)
      .values({ ...shipment, bookingNumber })
      .returning();
    return created;
  }

  async updateShipmentStatus(id: string, status: string): Promise<Shipment | undefined> {
    const updates: Partial<Shipment> = {
      status,
      updatedAt: new Date(),
    };

    if (status === "picked_up") {
      updates.pickedUpAt = new Date();
    } else if (status === "delivered") {
      updates.deliveredAt = new Date();
    }

    const [updated] = await db
      .update(shipments)
      .set(updates)
      .where(eq(shipments.id, id))
      .returning();
    return updated;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async getPaymentByShipment(shipmentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.shipmentId, shipmentId));
    return payment;
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  async getInvoiceByShipment(shipmentId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.shipmentId, shipmentId));
    return invoice;
  }

  // Quotation operations
  async getQuotationsByOffice(officeId: string): Promise<Quotation[]> {
    return db.select().from(quotations).where(eq(quotations.officeId, officeId)).orderBy(desc(quotations.createdAt));
  }

  async getQuotation(id: string): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation;
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const quotationNumber = `QT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    const [created] = await db
      .insert(quotations)
      .values({ ...quotation, quotationNumber })
      .returning();
    return created;
  }

  async updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const [updated] = await db
      .update(quotations)
      .set({ ...quotation, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    return updated;
  }

  async deleteQuotation(id: string): Promise<boolean> {
    await db.delete(quotations).where(eq(quotations.id, id));
    return true;
  }

  // Booking Request operations
  async getBookingRequestsByOffice(officeId: string): Promise<BookingRequest[]> {
    return db.select().from(bookingRequests).where(eq(bookingRequests.officeId, officeId)).orderBy(desc(bookingRequests.createdAt));
  }

  async getBookingRequest(id: string): Promise<BookingRequest | undefined> {
    const [request] = await db.select().from(bookingRequests).where(eq(bookingRequests.id, id));
    return request;
  }

  async createBookingRequest(request: InsertBookingRequest): Promise<BookingRequest> {
    const requestNumber = `BR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    const [created] = await db
      .insert(bookingRequests)
      .values({ ...request, requestNumber })
      .returning();
    return created;
  }

  async updateBookingRequestStatus(id: string, status: string, convertedShipmentId?: string): Promise<BookingRequest | undefined> {
    const updates: any = {
      status,
      reviewedAt: new Date(),
    };
    if (convertedShipmentId) {
      updates.convertedShipmentId = convertedShipmentId;
    }
    const [updated] = await db
      .update(bookingRequests)
      .set(updates)
      .where(eq(bookingRequests.id, id))
      .returning();
    return updated;
  }

  // Customer User operations
  async getCustomerUserByPhone(officeId: string, phone: string): Promise<CustomerUser | undefined> {
    const [user] = await db.select().from(customerUsers).where(
      and(eq(customerUsers.officeId, officeId), eq(customerUsers.phone, phone))
    );
    return user;
  }

  async getCustomerUserByEmail(officeId: string, email: string): Promise<CustomerUser | undefined> {
    const [user] = await db.select().from(customerUsers).where(
      and(eq(customerUsers.officeId, officeId), eq(customerUsers.email, email))
    );
    return user;
  }

  async getCustomerUser(id: string): Promise<CustomerUser | undefined> {
    const [user] = await db.select().from(customerUsers).where(eq(customerUsers.id, id));
    return user;
  }

  async createCustomerUser(user: InsertCustomerUser): Promise<CustomerUser> {
    const [created] = await db.insert(customerUsers).values(user).returning();
    return created;
  }

  async updateCustomerUser(id: string, data: Partial<InsertCustomerUser>): Promise<CustomerUser | undefined> {
    const [updated] = await db
      .update(customerUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerUsers.id, id))
      .returning();
    return updated;
  }

  // Customer Session operations
  async createCustomerSession(session: InsertCustomerSession): Promise<CustomerSession> {
    const [created] = await db.insert(customerSessions).values(session).returning();
    return created;
  }

  async getCustomerSessionByToken(token: string): Promise<CustomerSession | undefined> {
    const [session] = await db.select().from(customerSessions).where(
      and(eq(customerSessions.token, token), gte(customerSessions.expiresAt, new Date()))
    );
    return session;
  }

  async deleteCustomerSession(token: string): Promise<boolean> {
    await db.delete(customerSessions).where(eq(customerSessions.token, token));
    return true;
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(customerSessions).where(lte(customerSessions.expiresAt, new Date()));
  }

  // Customer booking requests
  async getBookingRequestsByCustomerUser(customerUserId: string): Promise<BookingRequest[]> {
    return db.select().from(bookingRequests)
      .where(eq(bookingRequests.customerUserId, customerUserId))
      .orderBy(desc(bookingRequests.createdAt));
  }

  // Office lookup by slug
  async getOfficeBySlug(slug: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.publicSlug, slug));
    return office;
  }

  async getPublicOffices(): Promise<Pick<Office, "id" | "name" | "city" | "state" | "pincode" | "phone" | "email" | "publicSlug">[]> {
    return db
      .select({
        id: offices.id,
        name: offices.name,
        city: offices.city,
        state: offices.state,
        pincode: offices.pincode,
        phone: offices.phone,
        email: offices.email,
        publicSlug: offices.publicSlug,
      })
      .from(offices)
      .where(isNotNull(offices.publicSlug));
  }

  // Dashboard stats
  async getDashboardStats(officeId: string): Promise<{
    todayBookings: number;
    todayRevenue: string;
    pendingPayments: string;
    monthlyBookings: number;
    monthlyRevenue: string;
    statusCounts: Record<string, number>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Today's stats
    const todayStats = await db
      .select({
        count: count(),
        revenue: sum(shipments.totalAmount),
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.officeId, officeId),
          gte(shipments.bookedAt, today),
          lte(shipments.bookedAt, todayEnd)
        )
      );

    // Monthly stats
    const monthlyStats = await db
      .select({
        count: count(),
        revenue: sum(shipments.totalAmount),
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.officeId, officeId),
          gte(shipments.bookedAt, monthStart),
          lte(shipments.bookedAt, monthEnd)
        )
      );

    // Status counts
    const statusResults = await db
      .select({
        status: shipments.status,
        count: count(),
      })
      .from(shipments)
      .where(eq(shipments.officeId, officeId))
      .groupBy(shipments.status);

    const statusCounts: Record<string, number> = {
      booked: 0,
      picked_up: 0,
      in_transit: 0,
      delivered: 0,
    };

    statusResults.forEach((row) => {
      statusCounts[row.status] = row.count;
    });

    // Pending payments (credit bookings)
    const pendingPayments = await db
      .select({
        total: sum(shipments.totalAmount),
      })
      .from(shipments)
      .leftJoin(payments, eq(shipments.id, payments.shipmentId))
      .where(
        and(
          eq(shipments.officeId, officeId),
          sql`${payments.id} IS NULL OR ${payments.paymentStatus} = 'pending'`
        )
      );

    return {
      todayBookings: todayStats[0]?.count || 0,
      todayRevenue: todayStats[0]?.revenue || "0",
      pendingPayments: pendingPayments[0]?.total || "0",
      monthlyBookings: monthlyStats[0]?.count || 0,
      monthlyRevenue: monthlyStats[0]?.revenue || "0",
      statusCounts,
    };
  }

  // Reports
  async getReportData(officeId: string, from: string, to: string): Promise<{
    dateWise: Array<{ date: string; bookings: number; revenue: string }>;
    customerWise: Array<{ customerId: string; customerName: string; bookings: number; revenue: string }>;
    partnerWise: Array<{ partnerId: string; partnerName: string; bookings: number; revenue: string }>;
    summary: { totalBookings: number; totalRevenue: string; avgBookingValue: string; topPartner: string; topCustomer: string };
  }> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Date-wise
    const dateWise = await db
      .select({
        date: sql<string>`DATE(${shipments.bookedAt})`,
        bookings: count(),
        revenue: sum(shipments.totalAmount),
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.officeId, officeId),
          gte(shipments.bookedAt, fromDate),
          lte(shipments.bookedAt, toDate)
        )
      )
      .groupBy(sql`DATE(${shipments.bookedAt})`)
      .orderBy(desc(sql`DATE(${shipments.bookedAt})`));

    // Customer-wise
    const customerWise = await db
      .select({
        customerId: customers.id,
        customerName: customers.name,
        bookings: count(),
        revenue: sum(shipments.totalAmount),
      })
      .from(shipments)
      .innerJoin(customers, eq(shipments.customerId, customers.id))
      .where(
        and(
          eq(shipments.officeId, officeId),
          gte(shipments.bookedAt, fromDate),
          lte(shipments.bookedAt, toDate)
        )
      )
      .groupBy(customers.id, customers.name)
      .orderBy(desc(sum(shipments.totalAmount)));

    // Partner-wise
    const partnerWise = await db
      .select({
        partnerId: courierPartners.id,
        partnerName: courierPartners.name,
        bookings: count(),
        revenue: sum(shipments.totalAmount),
      })
      .from(shipments)
      .innerJoin(courierPartners, eq(shipments.courierPartnerId, courierPartners.id))
      .where(
        and(
          eq(shipments.officeId, officeId),
          gte(shipments.bookedAt, fromDate),
          lte(shipments.bookedAt, toDate)
        )
      )
      .groupBy(courierPartners.id, courierPartners.name)
      .orderBy(desc(sum(shipments.totalAmount)));

    // Summary
    const summaryData = await db
      .select({
        totalBookings: count(),
        totalRevenue: sum(shipments.totalAmount),
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.officeId, officeId),
          gte(shipments.bookedAt, fromDate),
          lte(shipments.bookedAt, toDate)
        )
      );

    const totalBookings = summaryData[0]?.totalBookings || 0;
    const totalRevenue = summaryData[0]?.totalRevenue || "0";
    const avgBookingValue = totalBookings > 0 ? (parseFloat(totalRevenue) / totalBookings).toFixed(2) : "0";

    return {
      dateWise: dateWise.map((d) => ({
        date: d.date,
        bookings: d.bookings,
        revenue: d.revenue || "0",
      })),
      customerWise: customerWise.map((c) => ({
        customerId: c.customerId,
        customerName: c.customerName,
        bookings: c.bookings,
        revenue: c.revenue || "0",
      })),
      partnerWise: partnerWise.map((p) => ({
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        bookings: p.bookings,
        revenue: p.revenue || "0",
      })),
      summary: {
        totalBookings,
        totalRevenue,
        avgBookingValue,
        topPartner: partnerWise[0]?.partnerName || "-",
        topCustomer: customerWise[0]?.customerName || "-",
      },
    };
  }

  // Seed data
  async seedData(officeId: string): Promise<void> {
    // Check if data already exists
    const existingPartners = await this.getPartnersByOffice(officeId);
    if (existingPartners.length > 0) return;

    // Seed courier partners
    const partnersData: InsertCourierPartner[] = [
      {
        officeId,
        name: "DTDC Express",
        code: "DTDC",
        contactPerson: "Rahul Sharma",
        phone: "9876543210",
        email: "dtdc@example.com",
        baseRateSurface: "50",
        ratePerKgSurface: "30",
        baseRateAir: "100",
        ratePerKgAir: "60",
        awbPrefix: "DT",
        isActive: true,
      },
      {
        officeId,
        name: "FedEx India",
        code: "FEDEX",
        contactPerson: "Priya Patel",
        phone: "9876543211",
        email: "fedex@example.com",
        baseRateSurface: "80",
        ratePerKgSurface: "50",
        baseRateAir: "150",
        ratePerKgAir: "90",
        awbPrefix: "FX",
        isActive: true,
      },
      {
        officeId,
        name: "Blue Dart",
        code: "BD",
        contactPerson: "Amit Kumar",
        phone: "9876543212",
        email: "bluedart@example.com",
        baseRateSurface: "60",
        ratePerKgSurface: "40",
        baseRateAir: "120",
        ratePerKgAir: "75",
        awbPrefix: "BD",
        isActive: true,
      },
      {
        officeId,
        name: "Delhivery",
        code: "DEL",
        contactPerson: "Neha Singh",
        phone: "9876543213",
        email: "delhivery@example.com",
        baseRateSurface: "45",
        ratePerKgSurface: "25",
        baseRateAir: "90",
        ratePerKgAir: "55",
        awbPrefix: "DL",
        isActive: true,
      },
    ];

    const createdPartners: CourierPartner[] = [];
    for (const partner of partnersData) {
      const created = await this.createPartner(partner);
      createdPartners.push(created);
    }

    // Seed customers
    const customersData: InsertCustomer[] = [
      {
        officeId,
        name: "Sharma Electronics",
        phone: "9812345670",
        email: "sharma.electronics@example.com",
        address: "123 Market Street, Sector 15",
        city: "Noida",
        state: "Uttar Pradesh",
        pincode: "201301",
        gstNumber: "09AAAAA0000A1Z5",
        customerType: "business",
        paymentType: "credit",
        creditLimit: "50000",
      },
      {
        officeId,
        name: "Raj Enterprises",
        phone: "9812345671",
        email: "raj.enterprises@example.com",
        address: "456 Industrial Area, Phase 2",
        city: "Gurgaon",
        state: "Haryana",
        pincode: "122001",
        gstNumber: "06BBBBB0000B1Z5",
        customerType: "business",
        paymentType: "credit",
        creditLimit: "100000",
      },
      {
        officeId,
        name: "Priya Gupta",
        phone: "9812345672",
        address: "789 Residential Colony",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        customerType: "walk_in",
        paymentType: "prepaid",
      },
      {
        officeId,
        name: "Tech Solutions Pvt Ltd",
        phone: "9812345673",
        email: "info@techsolutions.com",
        address: "Tower A, IT Park",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        gstNumber: "29CCCCC0000C1Z5",
        customerType: "business",
        paymentType: "credit",
        creditLimit: "200000",
      },
    ];

    const createdCustomers: Customer[] = [];
    for (const customer of customersData) {
      const created = await this.createCustomer(customer);
      createdCustomers.push(created);
    }

    // Seed shipments
    const now = new Date();
    const shipmentsData: InsertShipment[] = [
      {
        officeId,
        customerId: createdCustomers[0].id,
        courierPartnerId: createdPartners[0].id,
        awbNumber: "DT12345678",
        senderName: "Sharma Electronics",
        senderPhone: "9812345670",
        senderAddress: "123 Market Street, Sector 15",
        senderCity: "Noida",
        senderState: "Uttar Pradesh",
        senderPincode: "201301",
        receiverName: "ABC Traders",
        receiverPhone: "9898989898",
        receiverAddress: "Shop 45, Main Bazar",
        receiverCity: "Mumbai",
        receiverState: "Maharashtra",
        receiverPincode: "400001",
        weight: "2.5",
        serviceType: "surface",
        status: "delivered",
        baseAmount: "125",
        totalAmount: "125",
        bookedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        officeId,
        customerId: createdCustomers[1].id,
        courierPartnerId: createdPartners[1].id,
        awbNumber: "FX98765432",
        senderName: "Raj Enterprises",
        senderPhone: "9812345671",
        senderAddress: "456 Industrial Area",
        senderCity: "Gurgaon",
        senderState: "Haryana",
        senderPincode: "122001",
        receiverName: "XYZ Corporation",
        receiverPhone: "9797979797",
        receiverAddress: "Corporate Tower, Business District",
        receiverCity: "Chennai",
        receiverState: "Tamil Nadu",
        receiverPincode: "600001",
        weight: "5.0",
        serviceType: "air",
        status: "in_transit",
        baseAmount: "600",
        totalAmount: "600",
        bookedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        officeId,
        customerId: createdCustomers[2].id,
        courierPartnerId: createdPartners[2].id,
        awbNumber: "BD55555555",
        senderName: "Priya Gupta",
        senderPhone: "9812345672",
        senderAddress: "789 Residential Colony",
        senderCity: "Delhi",
        senderState: "Delhi",
        senderPincode: "110001",
        receiverName: "Vikram Gupta",
        receiverPhone: "9696969696",
        receiverAddress: "456 Lake View Apartments",
        receiverCity: "Pune",
        receiverState: "Maharashtra",
        receiverPincode: "411001",
        weight: "1.0",
        serviceType: "surface",
        status: "picked_up",
        baseAmount: "100",
        totalAmount: "100",
        bookedAt: new Date(),
        pickedUpAt: new Date(),
      },
      {
        officeId,
        customerId: createdCustomers[3].id,
        courierPartnerId: createdPartners[0].id,
        awbNumber: "DT11111111",
        senderName: "Tech Solutions",
        senderPhone: "9812345673",
        senderAddress: "Tower A, IT Park",
        senderCity: "Bangalore",
        senderState: "Karnataka",
        senderPincode: "560001",
        receiverName: "Global Tech",
        receiverPhone: "9595959595",
        receiverAddress: "Cyber Hub, Phase 3",
        receiverCity: "Hyderabad",
        receiverState: "Telangana",
        receiverPincode: "500001",
        weight: "3.0",
        serviceType: "air",
        status: "booked",
        baseAmount: "280",
        totalAmount: "280",
        bookedAt: new Date(),
      },
      {
        officeId,
        courierPartnerId: createdPartners[3].id,
        senderName: "Walk-in Customer",
        senderPhone: "9999999999",
        senderAddress: "Local Address",
        senderCity: "Delhi",
        senderState: "Delhi",
        senderPincode: "110002",
        receiverName: "Quick Delivery",
        receiverPhone: "8888888888",
        receiverAddress: "Remote Location",
        receiverCity: "Jaipur",
        receiverState: "Rajasthan",
        receiverPincode: "302001",
        weight: "0.5",
        serviceType: "surface",
        status: "booked",
        baseAmount: "57.50",
        totalAmount: "57.50",
        bookedAt: new Date(),
      },
    ];

    for (const shipment of shipmentsData) {
      await this.createShipment(shipment);
    }
  }
}

export const storage = new DatabaseStorage();
