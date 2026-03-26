import { describe, expect, it } from "vitest";
import { mapOrderStatusToMetaEvent } from "@/lib/metaTracking";

describe("mapOrderStatusToMetaEvent", () => {
  it("maps delivered to a non-purchase lifecycle event", () => {
    expect(mapOrderStatusToMetaEvent("delivered")).toBe("OrderDelivered");
  });

  it("keeps cancellation and return tracking intact", () => {
    expect(mapOrderStatusToMetaEvent("cancelled")).toBe("CancelOrder");
    expect(mapOrderStatusToMetaEvent("returned")).toBe("ReturnOrder");
  });

  it("ignores non-conversion statuses", () => {
    expect(mapOrderStatusToMetaEvent("processing")).toBeNull();
    expect(mapOrderStatusToMetaEvent("confirmed")).toBeNull();
  });
});