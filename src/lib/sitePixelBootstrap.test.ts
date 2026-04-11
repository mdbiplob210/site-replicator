import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureSitePixelBootstrap, getSiteTrackedPageViewEventId } from "./sitePixelBootstrap";

describe("sitePixelBootstrap", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "<div id='root'></div>";
    localStorage.clear();

    delete (window as any).fbq;
    delete (window as any)._fbq;
    delete (window as any).__siteMetaPixelBootstrapped;
    delete (window as any).__siteMetaPixelTrackedUrls;
    delete (window as any).__siteCurrentPixelId;
    delete (window as any).__siteMetaPixelLifecycleInstalled;
    delete (window as any).__siteFbSdkLoaded;
    delete (window as any)._sitePageViewEventId;
    delete (window as any).__sitePageViewTracked;

    window.history.replaceState({}, "", "/");
  });

  it("queues PageView to stub immediately before SDK loads", () => {
    ensureSitePixelBootstrap("123");

    const eventId = getSiteTrackedPageViewEventId("123", window.location.href);
    expect(eventId).toMatch(/^eid_/);

    const pageViewCall = (window as any).fbq.queue.find(
      (args: any[]) => args[0] === "track" && args[1] === "PageView"
    );
    expect(pageViewCall).toBeTruthy();
  });

  it("fires via callMethod when fbq is ready", () => {
    const callMethod = vi.fn();
    const fbq = vi.fn((...args: any[]) => callMethod(...args)) as any;
    fbq.callMethod = callMethod;
    (window as any).fbq = fbq;

    ensureSitePixelBootstrap("123");

    const eventId = getSiteTrackedPageViewEventId("123", window.location.href);
    expect(callMethod).toHaveBeenCalledWith("track", "PageView", {}, { eventID: eventId });
  });

  it("does not duplicate PageView for same URL", () => {
    ensureSitePixelBootstrap("123");
    const eventId1 = getSiteTrackedPageViewEventId("123", window.location.href);

    ensureSitePixelBootstrap("123");
    const eventId2 = getSiteTrackedPageViewEventId("123", window.location.href);

    expect(eventId1).toBe(eventId2);
  });
});
