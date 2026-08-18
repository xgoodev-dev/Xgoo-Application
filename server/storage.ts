import {
  offices,
  branches,
  officeMembers,
  branchServiceAreas,
  customers,
  courierPartners,
  tariffVersions,
  tariffRateRows,
  shipments,
  payments,
  invoices,
  quotations,
  bookingRequests,
  customerUsers,
  customerSessions,
  customerAddresses,
  customerPushTokens,
  customerNotifications,
  type Office,
  type InsertOffice,
  type Branch,
  type InsertBranch,
  type OfficeMember,
  type InsertOfficeMember,
  type BranchServiceArea,
  type InsertBranchServiceArea,
  type BranchWithServiceAreas,
  type Customer,
  type InsertCustomer,
  type CourierPartner,
  type InsertCourierPartner,
  type TariffVersion,
  type InsertTariffVersion,
  type TariffRateRow,
  type InsertTariffRateRow,
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
  type CustomerAddress,
  type InsertCustomerAddress,
  type CustomerSession,
  type InsertCustomerSession,
  type CustomerPushToken,
  type CustomerNotification,
  type InsertCustomerNotification,
  type ShipmentWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, desc, asc, sql, count, sum, isNotNull, inArray, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { distanceKm, geocodeIndianPincode, normalizePincode } from "./geocode";
import { buildQuote, type PricingQuoteInput, type PricingQuoteResult } from "@shared/pricing";

export interface IStorage {
  // Office operations
  getOfficeByUserId(userId: string): Promise<Office | undefined>;
  createOffice(office: InsertOffice): Promise<Office>;
  updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office | undefined>;
  backfillPublicSlugs(): Promise<void>;
  getOfficeMemberByUserId(userId: string): Promise<OfficeMember | undefined>;
  getOfficeMembersByOffice(officeId: string): Promise<OfficeMember[]>;
  upsertOfficeMember(member: InsertOfficeMember): Promise<OfficeMember>;
  updateOfficeMember(
    id: string,
    officeId: string,
    data: Partial<InsertOfficeMember>,
  ): Promise<OfficeMember | undefined>;
  deleteOfficeMember(id: string, officeId: string): Promise<boolean>;

  // Branch operations
  getBranchesByOffice(officeId: string): Promise<BranchWithServiceAreas[]>;
  getBranch(id: string): Promise<BranchWithServiceAreas | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: string): Promise<boolean>;
  createBranchServiceArea(area: InsertBranchServiceArea): Promise<BranchServiceArea>;
  updateBranchServiceArea(id: string, area: Partial<InsertBranchServiceArea>): Promise<BranchServiceArea | undefined>;
  deleteBranchServiceArea(id: string): Promise<boolean>;
  ensureDefaultBranchForOffice(office: Office): Promise<Branch>;
  backfillBranches(): Promise<void>;
  findBranchForPickup(
    officeId: string,
    options: { pincode?: string | null; lat?: number | null; lng?: number | null },
  ): Promise<Branch | undefined>;

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

  // Tariff & pricing
  getTariffVersionsByOffice(officeId: string): Promise<(TariffVersion & { partnerName?: string | null })[]>;
  getTariffVersion(id: string): Promise<TariffVersion | undefined>;
  createTariffVersion(version: InsertTariffVersion): Promise<TariffVersion>;
  updateTariffVersion(id: string, data: Partial<InsertTariffVersion>): Promise<TariffVersion | undefined>;
  deleteTariffVersion(id: string): Promise<boolean>;
  activateTariffVersion(id: string, officeId: string): Promise<TariffVersion | undefined>;
  insertTariffRateRows(rows: InsertTariffRateRow[]): Promise<number>;
  getActiveTariffRows(officeId: string, courierPartnerId: string): Promise<TariffRateRow[]>;
  getTariffRateRowsByVersion(tariffVersionId: string): Promise<TariffRateRow[]>;
  getTariffRateRowsEnriched(tariffVersionId: string): Promise<Array<TariffRateRow & { partnerName: string; partnerCode: string }>>;
  getTariffRateRow(id: string): Promise<TariffRateRow | undefined>;
  updateTariffRateRow(id: string, data: Partial<InsertTariffRateRow>): Promise<TariffRateRow | undefined>;
  deleteTariffRateRows(ids: string[]): Promise<number>;
  bulkSaveTariffRows(
    versionId: string,
    officeId: string,
    rows: Array<Partial<InsertTariffRateRow> & { id?: string }>,
    userId?: string,
  ): Promise<{ created: number; updated: number }>;
  compareTariffVersions(
    versionAId: string,
    versionBId: string,
  ): Promise<Array<{ weight: string; oldPrice: number; newPrice: number; diff: number; pctDiff: number }>>;
  archiveTariffVersion(id: string, officeId: string): Promise<TariffVersion | undefined>;
  quotePrice(officeId: string, input: PricingQuoteInput): Promise<PricingQuoteResult | null>;
  quoteAllPartners(
    officeId: string,
    input: Omit<PricingQuoteInput, "courierPartnerId">,
  ): Promise<Array<PricingQuoteResult & { partnerName: string; partnerCode: string }>>;

  // Shipment operations
  getShipmentsByOffice(officeId: string): Promise<ShipmentWithRelations[]>;
  getShipment(id: string): Promise<ShipmentWithRelations | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipmentStatus(id: string, status: string): Promise<Shipment | undefined>;
  updateShipmentPartnerSync(
    id: string,
    data: {
      partnerSyncStatus?: string;
      externalAwb?: string | null;
      awbNumber?: string | null;
      partnerSyncError?: string | null;
      partnerSyncedAt?: Date | null;
    },
  ): Promise<Shipment | undefined>;

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
  getBookingRequestsByOffice(officeId: string, branchId?: string | null): Promise<BookingRequest[]>;
  getBookingRequest(id: string): Promise<BookingRequest | undefined>;
  createBookingRequest(request: InsertBookingRequest): Promise<BookingRequest>;
  updateBookingRequestStatus(id: string, status: string, convertedShipmentId?: string): Promise<BookingRequest | undefined>;
  getShipmentForBookingRequest(request: BookingRequest): Promise<Shipment | undefined>;
  getBookingRequestByShipmentId(shipmentId: string): Promise<BookingRequest | undefined>;

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
  upsertCustomerPushToken(
    customerUserId: string,
    token: string,
    platform: string,
  ): Promise<CustomerPushToken>;
  getCustomerPushTokens(customerUserId: string): Promise<CustomerPushToken[]>;
  createCustomerNotification(
    notification: InsertCustomerNotification,
  ): Promise<CustomerNotification>;
  getCustomerNotifications(customerUserId: string): Promise<CustomerNotification[]>;
  markCustomerNotificationsRead(customerUserId: string, id?: string): Promise<void>;

  // Customer booking requests (by customer user)
  getBookingRequestsByCustomerUser(customerUserId: string): Promise<BookingRequest[]>;

  // Customer saved addresses
  getCustomerAddresses(customerUserId: string): Promise<CustomerAddress[]>;
  createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: string, customerUserId: string, data: Partial<InsertCustomerAddress>): Promise<CustomerAddress | undefined>;
  deleteCustomerAddress(id: string, customerUserId: string): Promise<boolean>;

  /** Public portal: shipment in this office by booking # or AWB */
  getShipmentByOfficeAndTracking(officeId: string, trackingNumber: string): Promise<Shipment | undefined>;
  /** Public portal: booking request in this office by request # (e.g. BR...) */
  getBookingRequestByOfficeAndRequestNumber(officeId: string, requestNumber: string): Promise<BookingRequest | undefined>;

  // Office lookup
  getOfficeBySlug(slug: string): Promise<Office | undefined>;
  getDefaultBookingOffice(): Promise<Office | undefined>;

  // Dashboard stats
  getDashboardStats(officeId: string): Promise<{
    todayBookings: number;
    todayRevenue: string;
    pendingPayments: string;
    monthlyBookings: number;
    monthlyRevenue: string;
    pendingBookingRequests: number;
    todayBookingRequests: number;
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
  getDemoDataStatus(officeId: string): Promise<{
    hasDemoData: boolean;
    counts: {
      partners: number;
      customers: number;
      shipments: number;
      quotations: number;
      bookingRequests: number;
    };
  }>;
  seedData(officeId: string): Promise<void>;
  clearDemoData(officeId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Office operations
  async getOfficeByUserId(userId: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.userId, userId));
    if (office) return office;

    const [membership] = await db
      .select({ office: offices })
      .from(officeMembers)
      .innerJoin(offices, eq(officeMembers.officeId, offices.id))
      .where(
        and(
          eq(officeMembers.userId, userId),
          eq(officeMembers.status, "active"),
        ),
      )
      .limit(1);
    return membership?.office;
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    if (!office.publicSlug) {
      office.publicSlug = await this.generateUniqueSlug(office.name || "office");
    }
    const [created] = await db.insert(offices).values(office).returning();
    await this.ensureDefaultBranchForOffice(created);
    return created;
  }

  async getOfficeMemberByUserId(userId: string): Promise<OfficeMember | undefined> {
    const [member] = await db
      .select()
      .from(officeMembers)
      .where(eq(officeMembers.userId, userId))
      .limit(1);
    return member;
  }

  async getOfficeMembersByOffice(officeId: string): Promise<OfficeMember[]> {
    return db
      .select()
      .from(officeMembers)
      .where(eq(officeMembers.officeId, officeId))
      .orderBy(asc(officeMembers.displayName), asc(officeMembers.email));
  }

  async upsertOfficeMember(member: InsertOfficeMember): Promise<OfficeMember> {
    const [saved] = await db
      .insert(officeMembers)
      .values(member)
      .onConflictDoUpdate({
        target: officeMembers.userId,
        set: {
          officeId: member.officeId,
          email: member.email,
          displayName: member.displayName,
          role: member.role,
          status: member.status,
          branchId: member.branchId,
          invitedByUserId: member.invitedByUserId,
          updatedAt: new Date(),
        },
      })
      .returning();
    return saved;
  }

  async updateOfficeMember(
    id: string,
    officeId: string,
    data: Partial<InsertOfficeMember>,
  ): Promise<OfficeMember | undefined> {
    const [updated] = await db
      .update(officeMembers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(officeMembers.id, id), eq(officeMembers.officeId, officeId)))
      .returning();
    return updated;
  }

  async deleteOfficeMember(id: string, officeId: string): Promise<boolean> {
    const result = await db
      .delete(officeMembers)
      .where(and(eq(officeMembers.id, id), eq(officeMembers.officeId, officeId)));
    return (result.rowCount ?? 0) > 0;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    if (!base) base = "office";
    let slug = base;
    let attempt = 0;
    while (true) {
      const existing = await this.getOfficeBySlug(slug);
      if (!existing) return slug;
      attempt++;
      slug = `${base}-${attempt}`;
    }
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

  // Tariff & pricing
  async getTariffVersionsByOffice(officeId: string): Promise<(TariffVersion & { partnerName?: string | null })[]> {
    const rows = await db
      .select({
        version: tariffVersions,
        partnerName: courierPartners.name,
      })
      .from(tariffVersions)
      .leftJoin(courierPartners, eq(tariffVersions.courierPartnerId, courierPartners.id))
      .where(eq(tariffVersions.officeId, officeId))
      .orderBy(desc(tariffVersions.createdAt));
    return rows.map((r) => ({ ...r.version, partnerName: r.partnerName }));
  }

  async getTariffVersion(id: string): Promise<TariffVersion | undefined> {
    const [row] = await db.select().from(tariffVersions).where(eq(tariffVersions.id, id));
    return row;
  }

  async createTariffVersion(version: InsertTariffVersion): Promise<TariffVersion> {
    const [created] = await db.insert(tariffVersions).values(version).returning();
    return created;
  }

  async updateTariffVersion(id: string, data: Partial<InsertTariffVersion>): Promise<TariffVersion | undefined> {
    const [updated] = await db
      .update(tariffVersions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tariffVersions.id, id))
      .returning();
    return updated;
  }

  async deleteTariffVersion(id: string): Promise<boolean> {
    await db.delete(tariffVersions).where(eq(tariffVersions.id, id));
    return true;
  }

  async activateTariffVersion(id: string, officeId: string): Promise<TariffVersion | undefined> {
    const version = await this.getTariffVersion(id);
    if (!version || version.officeId !== officeId) return undefined;

    const now = new Date();
    await db
      .update(tariffVersions)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          eq(tariffVersions.officeId, officeId),
          eq(tariffVersions.status, "active"),
          ne(tariffVersions.id, id),
        ),
      );

    const [activated] = await db
      .update(tariffVersions)
      .set({ status: "active", validFrom: version.validFrom || now, updatedAt: now })
      .where(eq(tariffVersions.id, id))
      .returning();
    return activated;
  }

  async insertTariffRateRows(rows: InsertTariffRateRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      await db.insert(tariffRateRows).values(rows.slice(i, i + batchSize));
    }
    return rows.length;
  }

  async getActiveTariffRows(officeId: string, courierPartnerId: string): Promise<TariffRateRow[]> {
    const activeVersions = await db
      .select({ id: tariffVersions.id })
      .from(tariffVersions)
      .where(
        and(
          eq(tariffVersions.officeId, officeId),
          eq(tariffVersions.status, "active"),
          or(
            eq(tariffVersions.courierPartnerId, courierPartnerId),
            sql`${tariffVersions.courierPartnerId} IS NULL`,
          ),
        ),
      );

    if (activeVersions.length === 0) return [];

    const versionIds = activeVersions.map((v) => v.id);
    return db
      .select()
      .from(tariffRateRows)
      .where(
        and(
          eq(tariffRateRows.officeId, officeId),
          eq(tariffRateRows.courierPartnerId, courierPartnerId),
          inArray(tariffRateRows.tariffVersionId, versionIds),
        ),
      );
  }

  async getTariffRateRowsByVersion(tariffVersionId: string): Promise<TariffRateRow[]> {
    return db
      .select()
      .from(tariffRateRows)
      .where(eq(tariffRateRows.tariffVersionId, tariffVersionId))
      .orderBy(asc(tariffRateRows.weightMin));
  }

  async getTariffRateRowsEnriched(tariffVersionId: string) {
    const rows = await db
      .select({
        row: tariffRateRows,
        partnerName: courierPartners.name,
        partnerCode: courierPartners.code,
      })
      .from(tariffRateRows)
      .innerJoin(courierPartners, eq(tariffRateRows.courierPartnerId, courierPartners.id))
      .where(eq(tariffRateRows.tariffVersionId, tariffVersionId))
      .orderBy(asc(tariffRateRows.weightMin));
    return rows.map((r) => ({
      ...r.row,
      partnerName: r.partnerName,
      partnerCode: r.partnerCode,
    }));
  }

  async getTariffRateRow(id: string): Promise<TariffRateRow | undefined> {
    const [row] = await db.select().from(tariffRateRows).where(eq(tariffRateRows.id, id));
    return row;
  }

  async updateTariffRateRow(id: string, data: Partial<InsertTariffRateRow>): Promise<TariffRateRow | undefined> {
    const [updated] = await db
      .update(tariffRateRows)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tariffRateRows.id, id))
      .returning();
    return updated;
  }

  async deleteTariffRateRows(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    await db.delete(tariffRateRows).where(inArray(tariffRateRows.id, ids));
    return ids.length;
  }

  async bulkSaveTariffRows(
    versionId: string,
    officeId: string,
    rows: Array<Partial<InsertTariffRateRow> & { id?: string }>,
    userId?: string,
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;
    for (const row of rows) {
      const { id, ...data } = row;
      if (id && !id.startsWith("new-")) {
        await this.updateTariffRateRow(id, { ...data, updatedBy: userId || null });
        updated++;
      } else {
        await db.insert(tariffRateRows).values({
          tariffVersionId: versionId,
          officeId,
          courierPartnerId: data.courierPartnerId!,
          serviceType: data.serviceType || "surface",
          shipmentType: data.shipmentType || "domestic",
          originCountry: data.originCountry || "IN",
          destinationCountry: data.destinationCountry || null,
          originPincode: data.originPincode || null,
          destinationPincode: data.destinationPincode || null,
          originZone: data.originZone || null,
          destinationZone: data.destinationZone || null,
          weightMin: data.weightMin || "0",
          weightMax: data.weightMax || "999",
          tariffAmount: data.tariffAmount || "0",
          fixedMargin: data.fixedMargin || "0",
          percentageMargin: data.percentageMargin || "0",
          affiliateMargin: data.affiliateMargin || "0",
          offerDiscount: data.offerDiscount || "0",
          fuelCharge: data.fuelCharge || "0",
          handlingCharge: data.handlingCharge || "0",
          insuranceCharge: data.insuranceCharge || "0",
          remoteAreaCharge: data.remoteAreaCharge || "0",
          gst: data.gst || "0",
          customerPrice: data.customerPrice || "0",
          transitDays: data.transitDays ?? null,
          isActive: data.isActive !== false,
          notes: data.notes || null,
          customFields: data.customFields || {},
          updatedBy: userId || null,
        });
        created++;
      }
    }
    const count = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(tariffRateRows)
      .where(eq(tariffRateRows.tariffVersionId, versionId));
    await this.updateTariffVersion(versionId, { rowCount: count[0]?.c ?? 0 });
    return { created, updated };
  }

  async compareTariffVersions(versionAId: string, versionBId: string) {
    const [rowsA, rowsB] = await Promise.all([
      this.getTariffRateRowsByVersion(versionAId),
      this.getTariffRateRowsByVersion(versionBId),
    ]);
    const mapA = new Map(rowsA.map((r) => [
      `${r.courierPartnerId}|${r.serviceType}|${r.weightMin}|${r.weightMax}|${r.originPincode}|${r.destinationPincode}`,
      parseFloat(r.customerPrice || r.tariffAmount || "0"),
    ]));
    const mapB = new Map(rowsB.map((r) => [
      `${r.courierPartnerId}|${r.serviceType}|${r.weightMin}|${r.weightMax}|${r.originPincode}|${r.destinationPincode}`,
      { price: parseFloat(r.customerPrice || r.tariffAmount || "0"), row: r },
    ]));
    const keys = Array.from(new Set([...Array.from(mapA.keys()), ...Array.from(mapB.keys())]));
    const result: Array<{ weight: string; oldPrice: number; newPrice: number; diff: number; pctDiff: number }> = [];
    for (const key of keys) {
      const oldPrice = mapA.get(key) ?? 0;
      const bEntry = mapB.get(key);
      const newPrice = bEntry?.price ?? 0;
      const weight = bEntry?.row ? `${bEntry.row.weightMin}–${bEntry.row.weightMax}` : key.split("|")[2] + "–" + key.split("|")[3];
      const diff = newPrice - oldPrice;
      const pctDiff = oldPrice > 0 ? Math.round((diff / oldPrice) * 10000) / 100 : newPrice > 0 ? 100 : 0;
      result.push({ weight, oldPrice, newPrice, diff, pctDiff });
    }
    return result.sort((a, b) => a.weight.localeCompare(b.weight));
  }

  async archiveTariffVersion(id: string, officeId: string): Promise<TariffVersion | undefined> {
    const version = await this.getTariffVersion(id);
    if (!version || version.officeId !== officeId) return undefined;
    const [archived] = await db
      .update(tariffVersions)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(tariffVersions.id, id))
      .returning();
    return archived;
  }

  async quotePrice(officeId: string, input: PricingQuoteInput): Promise<PricingQuoteResult | null> {
    const partner = await this.getPartner(input.courierPartnerId);
    if (!partner || partner.officeId !== officeId || !partner.isActive) return null;
    const rows = await this.getActiveTariffRows(officeId, input.courierPartnerId);
    return buildQuote(partner, rows, input);
  }

  async quoteAllPartners(
    officeId: string,
    input: Omit<PricingQuoteInput, "courierPartnerId">,
  ): Promise<Array<PricingQuoteResult & { partnerName: string; partnerCode: string }>> {
    const partners = (await this.getPartnersByOffice(officeId)).filter((p) => p.isActive);
    const results: Array<PricingQuoteResult & { partnerName: string; partnerCode: string }> = [];

    for (const partner of partners) {
      const rows = await this.getActiveTariffRows(officeId, partner.id);
      const quote = buildQuote(partner, rows, { ...input, courierPartnerId: partner.id });
      results.push({
        ...quote,
        partnerName: partner.name,
        partnerCode: partner.code,
      });
    }

    return results.sort((a, b) => a.sellPrice - b.sellPrice);
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

  async updateShipmentPartnerSync(
    id: string,
    data: {
      partnerSyncStatus?: string;
      externalAwb?: string | null;
      awbNumber?: string | null;
      partnerSyncError?: string | null;
      partnerSyncedAt?: Date | null;
    },
  ): Promise<Shipment | undefined> {
    const updates: Partial<Shipment> = {
      updatedAt: new Date(),
    };

    if (data.partnerSyncStatus !== undefined) {
      updates.partnerSyncStatus = data.partnerSyncStatus;
    }
    if (data.externalAwb !== undefined) {
      updates.externalAwb = data.externalAwb;
    }
    if (data.awbNumber !== undefined) {
      updates.awbNumber = data.awbNumber;
    }
    if (data.partnerSyncError !== undefined) {
      updates.partnerSyncError = data.partnerSyncError;
    }
    if (data.partnerSyncedAt !== undefined) {
      updates.partnerSyncedAt = data.partnerSyncedAt;
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
  async getBookingRequestsByOffice(
    officeId: string,
    branchId?: string | null,
  ): Promise<BookingRequest[]> {
    return db
      .select()
      .from(bookingRequests)
      .where(
        branchId
          ? and(
              eq(bookingRequests.officeId, officeId),
              eq(bookingRequests.branchId, branchId),
            )
          : eq(bookingRequests.officeId, officeId),
      )
      .orderBy(desc(bookingRequests.createdAt));
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

  async getShipmentForBookingRequest(request: BookingRequest): Promise<Shipment | undefined> {
    if (request.convertedShipmentId) {
      return this.getShipment(request.convertedShipmentId);
    }

    if (!request.senderPhone || !request.receiverPhone || !request.createdAt) {
      return undefined;
    }

    const [matched] = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.officeId, request.officeId),
          eq(shipments.senderPhone, request.senderPhone),
          eq(shipments.receiverPhone, request.receiverPhone),
          gte(shipments.bookedAt, request.createdAt),
        ),
      )
      .orderBy(desc(shipments.bookedAt))
      .limit(1);

    if (matched) {
      await this.updateBookingRequestStatus(request.id, "converted", matched.id);
      return matched;
    }

    return undefined;
  }

  async getBookingRequestByShipmentId(
    shipmentId: string,
  ): Promise<BookingRequest | undefined> {
    const [request] = await db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.convertedShipmentId, shipmentId))
      .limit(1);
    return request;
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

  async upsertCustomerPushToken(
    customerUserId: string,
    token: string,
    platform: string,
  ): Promise<CustomerPushToken> {
    const [saved] = await db
      .insert(customerPushTokens)
      .values({ customerUserId, token, platform })
      .onConflictDoUpdate({
        target: customerPushTokens.token,
        set: { customerUserId, platform, updatedAt: new Date() },
      })
      .returning();
    return saved;
  }

  async getCustomerPushTokens(customerUserId: string): Promise<CustomerPushToken[]> {
    return db
      .select()
      .from(customerPushTokens)
      .where(eq(customerPushTokens.customerUserId, customerUserId));
  }

  async createCustomerNotification(
    notification: InsertCustomerNotification,
  ): Promise<CustomerNotification> {
    const [created] = await db
      .insert(customerNotifications)
      .values(notification)
      .returning();
    return created;
  }

  async getCustomerNotifications(
    customerUserId: string,
  ): Promise<CustomerNotification[]> {
    return db
      .select()
      .from(customerNotifications)
      .where(eq(customerNotifications.customerUserId, customerUserId))
      .orderBy(desc(customerNotifications.createdAt));
  }

  async markCustomerNotificationsRead(
    customerUserId: string,
    id?: string,
  ): Promise<void> {
    await db
      .update(customerNotifications)
      .set({ readAt: new Date() })
      .where(
        id
          ? and(
              eq(customerNotifications.customerUserId, customerUserId),
              eq(customerNotifications.id, id),
            )
          : eq(customerNotifications.customerUserId, customerUserId),
      );
  }

  // Customer booking requests
  async getBookingRequestsByCustomerUser(customerUserId: string): Promise<BookingRequest[]> {
    return db.select().from(bookingRequests)
      .where(eq(bookingRequests.customerUserId, customerUserId))
      .orderBy(desc(bookingRequests.createdAt));
  }

  async getCustomerAddresses(customerUserId: string): Promise<CustomerAddress[]> {
    return db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerUserId, customerUserId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
  }

  async createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    if (address.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(customerAddresses.customerUserId, address.customerUserId),
            eq(customerAddresses.addressType, address.addressType || "sender")
          )
        );
    }
    const [created] = await db.insert(customerAddresses).values(address).returning();
    return created;
  }

  async updateCustomerAddress(
    id: string,
    customerUserId: string,
    data: Partial<InsertCustomerAddress>
  ): Promise<CustomerAddress | undefined> {
    if (data.isDefault) {
      const [existing] = await db.select().from(customerAddresses).where(eq(customerAddresses.id, id));
      if (existing) {
        await db
          .update(customerAddresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(customerAddresses.customerUserId, customerUserId),
              eq(customerAddresses.addressType, existing.addressType)
            )
          );
      }
    }
    const [updated] = await db
      .update(customerAddresses)
      .set(data)
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerUserId, customerUserId)))
      .returning();
    return updated;
  }

  async deleteCustomerAddress(id: string, customerUserId: string): Promise<boolean> {
    const result = await db
      .delete(customerAddresses)
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerUserId, customerUserId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getShipmentByOfficeAndTracking(officeId: string, trackingNumber: string): Promise<Shipment | undefined> {
    const q = trackingNumber.trim();
    if (!q) return undefined;
    const [row] = await db
      .select()
      .from(shipments)
      .where(
        and(
          eq(shipments.officeId, officeId),
          or(eq(shipments.bookingNumber, q), eq(shipments.awbNumber, q))
        )
      )
      .limit(1);
    return row;
  }

  async getBookingRequestByOfficeAndRequestNumber(officeId: string, rawRequestNumber: string): Promise<BookingRequest | undefined> {
    const normalized = rawRequestNumber.trim().replace(/^#/, "").toUpperCase();
    if (!normalized) return undefined;
    const [row] = await db
      .select()
      .from(bookingRequests)
      .where(and(eq(bookingRequests.officeId, officeId), eq(bookingRequests.requestNumber, normalized)))
      .limit(1);
    return row;
  }

  async backfillPublicSlugs(): Promise<void> {
    const officesWithoutSlug = await db.select().from(offices).where(sql`${offices.publicSlug} IS NULL`);
    for (const office of officesWithoutSlug) {
      const slug = await this.generateUniqueSlug(office.name || "office");
      await db.update(offices).set({ publicSlug: slug }).where(eq(offices.id, office.id));
    }
    if (officesWithoutSlug.length > 0) {
      console.log(`Backfilled publicSlug for ${officesWithoutSlug.length} office(s)`);
    }
  }

  private async loadBranchWithAreas(branchId: string): Promise<BranchWithServiceAreas | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, branchId));
    if (!branch) return undefined;
    const serviceAreas = await db
      .select()
      .from(branchServiceAreas)
      .where(eq(branchServiceAreas.branchId, branchId))
      .orderBy(asc(branchServiceAreas.pincode));
    return { ...branch, serviceAreas };
  }

  async getBranchesByOffice(officeId: string): Promise<BranchWithServiceAreas[]> {
    const branchRows = await db
      .select()
      .from(branches)
      .where(eq(branches.officeId, officeId))
      .orderBy(desc(branches.isPrimary), asc(branches.name));
    const result: BranchWithServiceAreas[] = [];
    for (const branch of branchRows) {
      const serviceAreas = await db
        .select()
        .from(branchServiceAreas)
        .where(eq(branchServiceAreas.branchId, branch.id))
        .orderBy(asc(branchServiceAreas.pincode));
      result.push({ ...branch, serviceAreas });
    }
    return result;
  }

  async getBranch(id: string): Promise<BranchWithServiceAreas | undefined> {
    return this.loadBranchWithAreas(id);
  }

  async ensureDefaultBranchForOffice(office: Office): Promise<Branch> {
    const existing = await db
      .select()
      .from(branches)
      .where(eq(branches.officeId, office.id))
      .limit(1);
    if (existing.length > 0) return existing[0];

    const [branch] = await db
      .insert(branches)
      .values({
        officeId: office.id,
        name: office.name || "Main Branch",
        address: office.address,
        city: office.city,
        state: office.state,
        pincode: office.pincode,
        phone: office.phone,
        email: office.email,
        isPrimary: true,
        isActive: true,
      })
      .returning();

    if (office.pincode) {
      try {
        const coords = await geocodeIndianPincode(office.pincode);
        await db.insert(branchServiceAreas).values({
          branchId: branch.id,
          pincode: normalizePincode(office.pincode),
          radiusKm: "25",
          centerLat: coords ? String(coords.lat) : null,
          centerLng: coords ? String(coords.lng) : null,
          label: "Primary service area",
        });
      } catch (geoErr) {
        console.warn("Could not geocode branch pincode:", geoErr);
        await db.insert(branchServiceAreas).values({
          branchId: branch.id,
          pincode: normalizePincode(office.pincode),
          radiusKm: "25",
          label: "Primary service area",
        });
      }
    }

    return branch;
  }

  async backfillBranches(): Promise<void> {
    const allOffices = await db.select().from(offices);
    let count = 0;
    for (const office of allOffices) {
      const [existing] = await db
        .select()
        .from(branches)
        .where(eq(branches.officeId, office.id))
        .limit(1);
      if (!existing) {
        await this.ensureDefaultBranchForOffice(office);
        count++;
      }
    }
    if (count > 0) {
      console.log(`Created default branch for ${count} office(s)`);
    }
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    if (branch.isPrimary) {
      await db
        .update(branches)
        .set({ isPrimary: false })
        .where(eq(branches.officeId, branch.officeId));
    }
    const [created] = await db.insert(branches).values(branch).returning();
    return created;
  }

  async updateBranch(id: string, data: Partial<InsertBranch>): Promise<Branch | undefined> {
    const [existing] = await db.select().from(branches).where(eq(branches.id, id));
    if (!existing) return undefined;

    if (data.isPrimary) {
      await db
        .update(branches)
        .set({ isPrimary: false })
        .where(eq(branches.officeId, existing.officeId));
    }

    const [updated] = await db
      .update(branches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
    return updated;
  }

  async deleteBranch(id: string): Promise<boolean> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    if (!branch) return false;

    const officeBranches = await db
      .select()
      .from(branches)
      .where(eq(branches.officeId, branch.officeId));
    if (officeBranches.length <= 1) return false;

    if (branch.isPrimary) {
      const next = officeBranches.find((b) => b.id !== id);
      if (next) {
        await db.update(branches).set({ isPrimary: true }).where(eq(branches.id, next.id));
      }
    }

    await db.delete(branches).where(eq(branches.id, id));
    return true;
  }

  async createBranchServiceArea(area: InsertBranchServiceArea): Promise<BranchServiceArea> {
    const pincode = normalizePincode(area.pincode);
    let centerLat = area.centerLat;
    let centerLng = area.centerLng;
    if (!centerLat || !centerLng) {
      const coords = await geocodeIndianPincode(pincode);
      if (coords) {
        centerLat = String(coords.lat);
        centerLng = String(coords.lng);
      }
    }
    const [created] = await db
      .insert(branchServiceAreas)
      .values({
        ...area,
        pincode,
        centerLat,
        centerLng,
      })
      .returning();
    return created;
  }

  async updateBranchServiceArea(
    id: string,
    data: Partial<InsertBranchServiceArea>,
  ): Promise<BranchServiceArea | undefined> {
    const patch = { ...data };
    if (patch.pincode) {
      patch.pincode = normalizePincode(patch.pincode);
      const coords = await geocodeIndianPincode(patch.pincode);
      if (coords) {
        patch.centerLat = String(coords.lat);
        patch.centerLng = String(coords.lng);
      }
    }
    const [updated] = await db
      .update(branchServiceAreas)
      .set(patch)
      .where(eq(branchServiceAreas.id, id))
      .returning();
    return updated;
  }

  async deleteBranchServiceArea(id: string): Promise<boolean> {
    const deleted = await db
      .delete(branchServiceAreas)
      .where(eq(branchServiceAreas.id, id))
      .returning();
    return deleted.length > 0;
  }

  async findBranchForPickup(
    officeId: string,
    options: { pincode?: string | null; lat?: number | null; lng?: number | null },
  ): Promise<Branch | undefined> {
    const branchList = await this.getBranchesByOffice(officeId);
    const activeBranches = branchList.filter((b) => b.isActive);
    if (!activeBranches.length) return undefined;

    const pincode = options.pincode ? normalizePincode(options.pincode) : "";
    let pickupLat = options.lat ?? null;
    let pickupLng = options.lng ?? null;

    if ((pickupLat == null || pickupLng == null) && pincode.length === 6) {
      const coords = await geocodeIndianPincode(pincode);
      if (coords) {
        pickupLat = coords.lat;
        pickupLng = coords.lng;
      }
    }

    type Match = { branch: Branch; distance: number; exact: boolean };
    const matches: Match[] = [];

    for (const branch of activeBranches) {
      for (const area of branch.serviceAreas) {
        const areaPincode = normalizePincode(area.pincode);
        if (pincode && areaPincode === pincode) {
          matches.push({ branch, distance: 0, exact: true });
          continue;
        }

        const radius = parseFloat(area.radiusKm || "0");
        if (radius > 0 && pickupLat != null && pickupLng != null && area.centerLat && area.centerLng) {
          const dist = distanceKm(
            pickupLat,
            pickupLng,
            parseFloat(area.centerLat),
            parseFloat(area.centerLng),
          );
          if (dist <= radius) {
            matches.push({ branch, distance: dist, exact: false });
          }
        }
      }
    }

    if (!matches.length) {
      const primary = activeBranches.find((b) => b.isPrimary);
      return primary || activeBranches[0];
    }

    matches.sort((a, b) => {
      if (a.exact !== b.exact) return a.exact ? -1 : 1;
      return a.distance - b.distance;
    });
    return matches[0].branch;
  }

  // Office lookup by slug
  async getOfficeBySlug(slug: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.publicSlug, slug));
    return office;
  }

  async getDefaultBookingOffice(): Promise<Office | undefined> {
    const canonicalOfficeId = process.env.XGOO_CANONICAL_OFFICE_ID?.trim();
    if (canonicalOfficeId) {
      const [office] = await db
        .select()
        .from(offices)
        .where(eq(offices.id, canonicalOfficeId))
        .limit(1);
      if (office) return office;
    }

    const envSlug = process.env.DEFAULT_OFFICE_SLUG?.trim();
    if (envSlug) {
      const office = await this.getOfficeBySlug(envSlug);
      if (office) return office;
    }

    const withSlug = await db
      .select({
        office: offices,
        bookingCount: count(bookingRequests.id),
      })
      .from(offices)
      .leftJoin(bookingRequests, eq(bookingRequests.officeId, offices.id))
      .where(isNotNull(offices.publicSlug))
      .groupBy(offices.id)
      .orderBy(desc(count(bookingRequests.id)), desc(offices.createdAt));

    if (withSlug.length === 0) return undefined;
    if (withSlug.length === 1) return withSlug[0].office;

    // Use the established operational office, not a newly-created empty
    // placeholder. This keeps customer apps and the Staff Portal in one tenant.
    const activeOffice = withSlug.find(
      ({ office, bookingCount }) =>
        Number(bookingCount) > 0 &&
        office.publicSlug !== "demo-office" &&
        !/^demo/i.test(office.name || ""),
    );
    if (activeOffice) return activeOffice.office;

    // Prefer a real tenant office over seed/demo placeholders when /book has no slug.
    const preferred = withSlug.find(
      ({ office }) =>
        office.publicSlug !== "demo-office" &&
        office.name !== "My Courier Office" &&
        !/^demo/i.test(office.name || ""),
    );
    return preferred?.office || withSlug[0].office;
  }

  // Dashboard stats
  async getDashboardStats(officeId: string): Promise<{
    todayBookings: number;
    todayRevenue: string;
    pendingPayments: string;
    monthlyBookings: number;
    monthlyRevenue: string;
    pendingBookingRequests: number;
    todayBookingRequests: number;
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

    const pendingRequests = await db
      .select({ count: count() })
      .from(bookingRequests)
      .where(and(eq(bookingRequests.officeId, officeId), eq(bookingRequests.status, "pending")));

    const todayRequests = await db
      .select({ count: count() })
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.officeId, officeId),
          gte(bookingRequests.createdAt, today),
          lte(bookingRequests.createdAt, todayEnd)
        )
      );

    return {
      todayBookings: todayStats[0]?.count || 0,
      todayRevenue: todayStats[0]?.revenue || "0",
      pendingPayments: pendingPayments[0]?.total || "0",
      monthlyBookings: monthlyStats[0]?.count || 0,
      monthlyRevenue: monthlyStats[0]?.revenue || "0",
      pendingBookingRequests: pendingRequests[0]?.count || 0,
      todayBookingRequests: todayRequests[0]?.count || 0,
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
  async getDemoDataStatus(officeId: string): Promise<{
    hasDemoData: boolean;
    counts: {
      partners: number;
      customers: number;
      shipments: number;
      quotations: number;
      bookingRequests: number;
    };
  }> {
    const [partnersRow] = await db
      .select({ count: count() })
      .from(courierPartners)
      .where(and(eq(courierPartners.officeId, officeId), eq(courierPartners.isDemo, true)));
    const [customersRow] = await db
      .select({ count: count() })
      .from(customers)
      .where(and(eq(customers.officeId, officeId), eq(customers.isDemo, true)));
    const [shipmentsRow] = await db
      .select({ count: count() })
      .from(shipments)
      .where(and(eq(shipments.officeId, officeId), eq(shipments.isDemo, true)));
    const [quotationsRow] = await db
      .select({ count: count() })
      .from(quotations)
      .where(and(eq(quotations.officeId, officeId), eq(quotations.isDemo, true)));
    const [bookingRequestsRow] = await db
      .select({ count: count() })
      .from(bookingRequests)
      .where(and(eq(bookingRequests.officeId, officeId), eq(bookingRequests.isDemo, true)));

    const counts = {
      partners: partnersRow?.count || 0,
      customers: customersRow?.count || 0,
      shipments: shipmentsRow?.count || 0,
      quotations: quotationsRow?.count || 0,
      bookingRequests: bookingRequestsRow?.count || 0,
    };

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { hasDemoData: total > 0, counts };
  }

  async clearDemoData(officeId: string): Promise<void> {
    const demoShipments = await db
      .select({ id: shipments.id })
      .from(shipments)
      .where(and(eq(shipments.officeId, officeId), eq(shipments.isDemo, true)));
    const shipmentIds = demoShipments.map((s) => s.id);

    if (shipmentIds.length > 0) {
      await db.delete(payments).where(inArray(payments.shipmentId, shipmentIds));
      await db.delete(invoices).where(inArray(invoices.shipmentId, shipmentIds));
      await db
        .update(bookingRequests)
        .set({ convertedShipmentId: null })
        .where(inArray(bookingRequests.convertedShipmentId, shipmentIds));
    }

    await db
      .delete(shipments)
      .where(and(eq(shipments.officeId, officeId), eq(shipments.isDemo, true)));
    await db
      .delete(bookingRequests)
      .where(and(eq(bookingRequests.officeId, officeId), eq(bookingRequests.isDemo, true)));
    await db
      .delete(quotations)
      .where(and(eq(quotations.officeId, officeId), eq(quotations.isDemo, true)));
    await db
      .delete(customers)
      .where(and(eq(customers.officeId, officeId), eq(customers.isDemo, true)));
    await db
      .delete(courierPartners)
      .where(and(eq(courierPartners.officeId, officeId), eq(courierPartners.isDemo, true)));
  }

  async seedData(officeId: string): Promise<void> {
    const status = await this.getDemoDataStatus(officeId);
    if (status.hasDemoData) return;

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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
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
        isDemo: true,
      },
    ];

    for (const shipment of shipmentsData) {
      await this.createShipment(shipment);
    }

    const quotationsData: InsertQuotation[] = [
      {
        officeId,
        customerName: "Demo Retail Store",
        customerPhone: "9876500001",
        customerEmail: "demo.retail@example.com",
        senderCity: "Hyderabad",
        senderState: "Telangana",
        senderPincode: "500001",
        receiverCity: "Chennai",
        receiverState: "Tamil Nadu",
        receiverPincode: "600001",
        weight: "8",
        numberOfPieces: 2,
        contentDescription: "Electronics sample",
        serviceType: "surface",
        courierPartnerId: createdPartners[3].id,
        baseAmount: "450",
        totalAmount: "450",
        status: "sent",
        isDemo: true,
      },
      {
        officeId,
        customerName: "Sample Exporter",
        customerPhone: "9876500002",
        senderCity: "Mumbai",
        senderState: "Maharashtra",
        senderPincode: "400001",
        receiverCity: "Dubai",
        receiverState: "UAE",
        receiverPincode: "00000",
        weight: "15",
        numberOfPieces: 1,
        contentDescription: "Documents",
        serviceType: "air",
        courierPartnerId: createdPartners[1].id,
        baseAmount: "3200",
        totalAmount: "3200",
        status: "draft",
        isDemo: true,
      },
    ];

    for (const quotation of quotationsData) {
      await this.createQuotation(quotation);
    }

    const bookingRequestsData: InsertBookingRequest[] = [
      {
        officeId,
        senderName: "Demo Portal User",
        senderPhone: "9876500003",
        senderEmail: "portal.demo@example.com",
        senderAddress: "12 Sample Street, Gachibowli",
        senderCity: "Hyderabad",
        senderState: "Telangana",
        senderPincode: "500032",
        receiverName: "Demo Receiver",
        receiverPhone: "9876500004",
        receiverAddress: "88 MG Road",
        receiverCity: "Bangalore",
        receiverState: "Karnataka",
        receiverPincode: "560001",
        weight: "3.5",
        numberOfPieces: 1,
        contentDescription: "Books",
        declaredValue: "1500",
        serviceType: "surface",
        courierPreference: "Delhivery",
        status: "pending",
        isDemo: true,
      },
      {
        officeId,
        senderName: "Walk-in Demo",
        senderPhone: "9876500005",
        senderAddress: "Counter booking sample",
        senderCity: "Delhi",
        senderState: "Delhi",
        senderPincode: "110001",
        receiverName: "Remote Demo",
        receiverPhone: "9876500006",
        receiverAddress: "Jaipur hub",
        receiverCity: "Jaipur",
        receiverState: "Rajasthan",
        receiverPincode: "302001",
        weight: "1",
        numberOfPieces: 1,
        serviceType: "surface",
        status: "pending",
        isDemo: true,
      },
    ];

    for (const request of bookingRequestsData) {
      await this.createBookingRequest(request);
    }
  }
}

export const storage = new DatabaseStorage();
