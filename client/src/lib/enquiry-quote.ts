import type { BookingRequest, Quotation } from "@shared/schema";

export type EnquiryQuote = {
  id: string;
  quotationNumber: string;
  totalAmount: string;
  status: string;
};

export type EnquiryWithQuote = BookingRequest & {
  pickupJob?: {
    id: string;
    status: string;
    partnerId?: string | null;
    partnerName?: string | null;
    quotationId?: string | null;
  } | null;
  quotation?: EnquiryQuote | null;
};

function last10(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function toEnquiryQuote(quote: Pick<Quotation, "id" | "quotationNumber" | "totalAmount" | "status">): EnquiryQuote {
  return {
    id: quote.id,
    quotationNumber: quote.quotationNumber,
    totalAmount: quote.totalAmount,
    status: quote.status,
  };
}

export function quotationForEnquiry(request: EnquiryWithQuote, quotes: Quotation[]): EnquiryQuote | null {
  if (request.quotation?.id && request.quotation.totalAmount) return request.quotation;

  const byRequest = quotes.find((quote) => quote.bookingRequestId === request.id);
  if (byRequest) return toEnquiryQuote(byRequest);

  if (request.pickupJob?.quotationId) {
    const byId = quotes.find((quote) => quote.id === request.pickupJob?.quotationId);
    if (byId) return toEnquiryQuote(byId);
  }

  if (request.pickupJob?.id) {
    const byJob = quotes.find((quote) => quote.pickupJobId === request.pickupJob?.id);
    if (byJob) return toEnquiryQuote(byJob);
  }

  const sender = last10(request.senderPhone);
  if (!sender || !request.pickupJob) return null;

  const requestTime = request.createdAt ? new Date(request.createdAt).getTime() : 0;
  const byPhone = quotes
    .filter((quote) => {
      if (last10(quote.customerPhone) !== sender) return false;
      if (quote.status !== "sent" && quote.status !== "accepted" && quote.status !== "rejected") {
        return false;
      }
      const quoteTime = quote.createdAt ? new Date(quote.createdAt).getTime() : 0;
      return !requestTime || quoteTime >= requestTime;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return byPhone[0] ? toEnquiryQuote(byPhone[0]) : null;
}
