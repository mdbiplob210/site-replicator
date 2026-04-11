import { describe, expect, it } from "vitest";
import { buildMetaPixelHeadScript } from "./landingPixelBootstrap";

describe("landingPixelBootstrap", () => {
  it("puts the fbq stub before the SDK script for first-load reliability", () => {
    const html = buildMetaPixelHeadScript("123");
    const stubIndex = html.indexOf("w.__lpMetaPixelBootstrapped");
    const sdkIndex = html.indexOf('src="https://connect.facebook.net/en_US/fbevents.js"');

    expect(stubIndex).toBeGreaterThan(-1);
    expect(sdkIndex).toBeGreaterThan(-1);
    expect(stubIndex).toBeLessThan(sdkIndex);
  });
});