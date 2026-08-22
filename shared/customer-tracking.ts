export type TrackingStepState = "completed" | "current" | "upcoming";

export interface TrackingStep {
  key: string;
  label: string;
  description: string;
  location: string | null;
  timestamp: string | null;
  state: TrackingStepState;
}

export interface CustomerTrackingView {
  overallStatus: string;
  overallStatusLabel: string;
  currentLocation: string;
  currentStatusDetail: string;
  isDelivered: boolean;
  isRejected: boolean;
  steps: TrackingStep[];
}

export interface BookingRequestTrackingInput {
  status: string;
  createdAt: string | Date | null;
  reviewedAt?: string | Date | null;
  pickupLocationName?: string | null;
  senderCity?: string | null;
  senderState?: string | null;
  senderAddress?: string | null;
  receiverCity?: string | null;
  receiverState?: string | null;
  receiverAddress?: string | null;
}

export interface ShipmentTrackingInput {
  status: string;
  bookedAt?: string | Date | null;
  pickedUpAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  senderCity?: string | null;
  senderState?: string | null;
  senderAddress?: string | null;
  receiverCity?: string | null;
  receiverState?: string | null;
  receiverAddress?: string | null;
  bookingNumber?: string | null;
  awbNumber?: string | null;
}

const REQUEST_PHASE_ORDER = ["pending", "reviewed", "approved", "converted"] as const;

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function joinLocation(parts: (string | null | undefined)[]): string | null {
  const text = parts.filter(Boolean).join(", ");
  return text || null;
}

function originLocation(request: BookingRequestTrackingInput, shipment?: ShipmentTrackingInput | null): string {
  return (
    request.pickupLocationName ||
    joinLocation([shipment?.senderCity, shipment?.senderState]) ||
    joinLocation([request.senderCity, request.senderState]) ||
    request.senderAddress ||
    "Pickup location"
  );
}

function destinationLocation(
  request: BookingRequestTrackingInput,
  shipment?: ShipmentTrackingInput | null,
): string {
  return (
    joinLocation([shipment?.receiverCity, shipment?.receiverState]) ||
    joinLocation([request.receiverCity, request.receiverState]) ||
    shipment?.receiverAddress ||
    request.receiverAddress ||
    "Delivery address"
  );
}

function requestPhaseIndex(status: string): number {
  const idx = REQUEST_PHASE_ORDER.indexOf(status as (typeof REQUEST_PHASE_ORDER)[number]);
  return idx >= 0 ? idx : 0;
}

function shipmentPhaseIndex(status: string): number {
  switch (status) {
    case "booked":
      return 0;
    case "picked_up":
      return 1;
    case "in_transit":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function markSteps(steps: Omit<TrackingStep, "state">[], currentKey: string): TrackingStep[] {
  let seenCurrent = false;
  return steps.map((step) => {
    if (step.key === currentKey) {
      seenCurrent = true;
      return { ...step, state: "current" };
    }
    if (!seenCurrent) {
      return { ...step, state: "completed" };
    }
    return { ...step, state: "upcoming" };
  });
}

export function buildCustomerTracking(
  request: BookingRequestTrackingInput,
  shipment?: ShipmentTrackingInput | null,
): CustomerTrackingView {
  const origin = originLocation(request, shipment);
  const destination = destinationLocation(request, shipment);

  if (request.status === "rejected") {
    const steps = markSteps(
      [
        {
          key: "submitted",
          label: "Request Submitted",
          description: "Your pickup request was received by the courier office.",
          location: origin,
          timestamp: toIso(request.createdAt),
        },
        {
          key: "rejected",
          label: "Request Rejected",
          description: "The courier office could not process this booking request.",
          location: "Courier office",
          timestamp: toIso(request.reviewedAt),
        },
      ],
      "rejected",
    );

    return {
      overallStatus: "rejected",
      overallStatusLabel: "Rejected",
      currentLocation: "Courier office",
      currentStatusDetail: "This booking request was not approved.",
      isDelivered: false,
      isRejected: true,
      steps,
    };
  }

  const requestSteps: Omit<TrackingStep, "state">[] = [
    {
      key: "submitted",
      label: "Request Submitted",
      description: "Your pickup request has been sent to the courier office.",
      location: origin,
      timestamp: toIso(request.createdAt),
    },
    {
      key: "reviewed",
      label: "Under Review",
      description: "The courier office is checking your request details.",
      location: "Courier office",
      timestamp: toIso(request.reviewedAt),
    },
    {
      key: "approved",
      label: "Approved for Pickup",
      description: "Your request is approved and pickup will be scheduled.",
      location: origin,
      timestamp: requestPhaseIndex(request.status) >= 2 ? toIso(request.reviewedAt) : null,
    },
    {
      key: "shipment_created",
      label: "Shipment Created",
      description: "Your parcel has been registered as a shipment.",
      location: origin,
      timestamp: shipment ? toIso(shipment.bookedAt) : null,
    },
  ];

  const shipmentSteps: Omit<TrackingStep, "state">[] = [
    {
      key: "booked",
      label: "Booked",
      description: "Shipment confirmed and awaiting courier pickup.",
      location: origin,
      timestamp: toIso(shipment?.bookedAt),
    },
    {
      key: "picked_up",
      label: "Picked Up",
      description: "Parcel collected from the pickup location.",
      location: origin,
      timestamp: toIso(shipment?.pickedUpAt),
    },
    {
      key: "in_transit",
      label: "In Transit",
      description: `Parcel is on the way to ${destination}.`,
      location: `En route to ${destination}`,
      timestamp: toIso(shipment?.pickedUpAt),
    },
    {
      key: "delivered",
      label: "Delivered",
      description: "Parcel delivered to the receiver.",
      location: destination,
      timestamp: toIso(shipment?.deliveredAt),
    },
  ];

  if (!shipment) {
    const currentKeyByRequestStatus: Record<string, string> = {
      pending: "reviewed",
      reviewed: "reviewed",
      approved: "approved",
      converted: "shipment_created",
    };
    const currentKey = currentKeyByRequestStatus[request.status] ?? "reviewed";

    const steps = markSteps(requestSteps, currentKey);
    const currentStep = steps.find((s) => s.state === "current") ?? steps[steps.length - 1];

    let currentLocation = currentStep.location || origin;
    let currentStatusDetail = currentStep.description;
    if (request.status === "pending") {
      currentLocation = origin;
      currentStatusDetail =
        "Your pickup request was submitted and is awaiting confirmation from the courier office.";
    } else if (request.status === "approved") {
      currentLocation = origin;
      currentStatusDetail = "Your request is approved. Pickup will be scheduled from your location.";
    }

    return {
      overallStatus: request.status,
      overallStatusLabel: statusLabel(request.status),
      currentLocation,
      currentStatusDetail,
      isDelivered: false,
      isRejected: false,
      steps,
    };
  }

  const shipIdx = shipmentPhaseIndex(shipment.status);
  const allSteps = [...requestSteps.slice(0, 3), ...shipmentSteps];
  const shipmentCurrentKeys = ["booked", "picked_up", "in_transit", "delivered"];
  const currentKey = shipmentCurrentKeys[shipIdx] ?? "booked";

  const steps = markSteps(allSteps, currentKey);
  const currentStep = steps.find((s) => s.state === "current") ?? steps[steps.length - 1];
  const isDelivered = shipment.status === "delivered";

  let currentLocation = currentStep.location || origin;
  let currentStatusDetail = currentStep.description;

  if (shipment.status === "in_transit") {
    currentLocation = `In transit — heading to ${destination}`;
    currentStatusDetail = `Your parcel is moving towards the delivery address in ${destination}.`;
  } else if (shipment.status === "picked_up") {
    currentLocation = `Picked up from ${origin}`;
    currentStatusDetail = "Your parcel has left the pickup point and is being processed for delivery.";
  } else if (shipment.status === "booked") {
    currentLocation = origin;
    currentStatusDetail = "Shipment is booked. Awaiting courier pickup from your location.";
  } else if (shipment.status === "cancelled") {
    currentLocation = origin;
    currentStatusDetail = "This shipment was cancelled and will not be picked up.";
  } else if (isDelivered) {
    currentLocation = destination;
    currentStatusDetail = "Parcel has been delivered successfully.";
  }

  return {
    overallStatus: shipment.status,
    overallStatusLabel: statusLabel(shipment.status),
    currentLocation,
    currentStatusDetail,
    isDelivered,
    isRejected: false,
    steps,
  };
}

export function buildCustomerTrackingSummary(
  request: BookingRequestTrackingInput,
  shipment?: ShipmentTrackingInput | null,
) {
  const tracking = buildCustomerTracking(request, shipment);
  return {
    overallStatus: tracking.overallStatus,
    overallStatusLabel: tracking.overallStatusLabel,
    currentLocation: tracking.currentLocation,
    currentStatusDetail: tracking.currentStatusDetail,
    isDelivered: tracking.isDelivered,
    isRejected: tracking.isRejected,
  };
}
