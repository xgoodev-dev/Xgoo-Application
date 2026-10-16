import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bookingRequestBodyFromDraft,
  canSubmitKioskDraft,
  detectKioskIntent,
  emptyKioskDraft,
  extractSpokenSlots,
  intentToScreen,
  isValidIndianMobile,
  isValidIndianPincode,
  missingFieldsForStep,
  nextSendStep,
  parsePositiveWeight,
  searchKnowledgeBase,
  statusToPlainLanguage,
  successFromBookingResponse,
  validateKioskDraft,
} from "./kiosk";

describe("kiosk intent", () => {
  it("maps send / track / rates speech", () => {
    assert.equal(detectKioskIntent("I want to send a parcel"), "send");
    assert.equal(detectKioskIntent("track my AWB"), "track");
    assert.equal(detectKioskIntent("how much will it cost"), "rates");
    assert.equal(detectKioskIntent("business bulk shipping"), "business");
    assert.equal(detectKioskIntent("call a staff member"), "staff");
    assert.equal(detectKioskIntent("start over"), "cancel");
    assert.equal(intentToScreen("unknown"), null);
  });
});

describe("kiosk draft validation", () => {
  it("rejects an empty draft", () => {
    const result = validateKioskDraft(emptyKioskDraft());
    assert.equal(result.ok, false);
    assert.ok(result.errors.length >= 4);
    assert.equal(canSubmitKioskDraft(emptyKioskDraft()), false);
  });

  it("requires sender fields before leaving sender step", () => {
    const draft = emptyKioskDraft();
    draft.shipmentType = "domestic";
    assert.deepEqual(missingFieldsForStep(draft, "intent"), []);
    assert.ok(missingFieldsForStep(draft, "sender").includes("senderName"));
  });

  it("accepts a complete domestic draft", () => {
    const draft = emptyKioskDraft();
    draft.shipmentType = "domestic";
    draft.senderName = "Ravi";
    draft.senderPhone = "9876543210";
    draft.senderAddress = "1 MG Road";
    draft.senderPincode = "500084";
    draft.receiverName = "Meera";
    draft.receiverPhone = "9123456789";
    draft.receiverAddress = "12 Park Street";
    draft.receiverPincode = "700016";
    draft.packageType = "non_document";
    draft.contentDescription = "Clothes";
    draft.weight = "1.2";
    const result = validateKioskDraft(draft);
    assert.equal(result.ok, true);
    assert.equal(canSubmitKioskDraft(draft), true);
  });

  it("does not invent international destination", () => {
    const draft = emptyKioskDraft();
    draft.shipmentType = "international";
    draft.senderName = "Ravi";
    draft.senderPhone = "9876543210";
    draft.senderAddress = "1 MG Road";
    draft.senderPincode = "500084";
    draft.receiverName = "Alex";
    draft.receiverPhone = "9123456789";
    draft.receiverAddress = "10 King St";
    draft.destinationCountry = "India";
    draft.packageType = "document";
    draft.contentDescription = "Passport copies";
    draft.weight = "0.4";
    assert.equal(validateKioskDraft(draft).ok, false);
  });
});

describe("kiosk helpers", () => {
  it("validates Indian mobiles and PIN codes", () => {
    assert.equal(isValidIndianMobile("9876543210"), true);
    assert.equal(isValidIndianMobile("12345"), false);
    assert.equal(isValidIndianPincode("500084"), true);
    assert.equal(isValidIndianPincode("000001"), false);
    assert.equal(parsePositiveWeight("0"), null);
    assert.equal(parsePositiveWeight("1.5"), 1.5);
  });

  it("walks send steps in order", () => {
    assert.equal(nextSendStep("intent"), "sender");
    assert.equal(nextSendStep("review"), "submitting");
    assert.equal(nextSendStep("failed"), "review");
  });

  it("never marks a booking request as booked or paid", () => {
    const result = successFromBookingResponse({
      success: true,
      requestNumber: "BR123",
    });
    assert.equal(result.booked, false);
    assert.equal(result.paid, false);
    assert.equal(result.labelReady, false);
    assert.equal(result.kind, "booking_request");
    assert.equal(successFromBookingResponse({ success: false }).success, false);
  });

  it("builds a booking-request payload without claiming AWB", () => {
    const draft = emptyKioskDraft();
    draft.shipmentType = "domestic";
    draft.senderName = "Ravi";
    draft.senderPhone = "919876543210";
    draft.senderAddress = "1 MG Road";
    draft.senderPincode = "500084";
    draft.receiverName = "Meera";
    draft.receiverPhone = "9123456789";
    draft.receiverAddress = "12 Park Street";
    draft.receiverPincode = "700016";
    draft.contentDescription = "Clothes";
    draft.weight = "2";
    draft.serviceType = "air";
    const body = bookingRequestBodyFromDraft(draft, "branch-1");
    assert.equal(body.source, "hub_kiosk");
    assert.equal(body.hub, "branch-1");
    assert.equal(body.senderPhone, "9876543210");
    assert.equal(body.weight, "2");
  });

  it("explains pending vs booked status in plain language", () => {
    assert.match(statusToPlainLanguage("pending"), /not a booked shipment/i);
    assert.match(statusToPlainLanguage("booked"), /created a shipment/i);
  });

  it("searches only the approved knowledge base", () => {
    const hits = searchKnowledgeBase("prohibited items");
    assert.ok(hits.some((a) => a.id === "prohibited"));
    assert.equal(searchKnowledgeBase("secret unpublished policy").length, 0);
  });

  it("extracts PIN and weight from speech without filling unknown names", () => {
    const slots = extractSpokenSlots("Send 2 kg to 500084");
    assert.equal(slots.weight, "2");
    assert.equal(slots.receiverPincode, "500084");
    assert.equal(slots.senderName, undefined);
  });
});
