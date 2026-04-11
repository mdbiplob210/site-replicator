import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureSitePixelBootstrap, getSiteTrackedPageViewEventId } from "./sitePixelBootstrap";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    __siteMetaPixelBootstrapped?: Record<string, boolean>;
    __siteMetaPixelTrackedUrls?: Record<string, string>;
    __siteCurrentPixelId?: string;
    __siteMetaPixelLifecycleInstalled?: boolean;
    __siteFbSdkLoaded?: boolean;
    _sitePageViewEventId?: string;
    __sitePageViewTracked?: boolean;
  }
}

describe("sitePixelBootstrap", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "<div id='root'></div>";
    localStorage.clear();
    sessionStorage.clear();

    delete window.fbq;
    delete window._fbq;
    delete window.__siteMetaPixelBootstrapped;
    delete window.__siteMetaPixelTrackedUrls;
    delete window.__siteCurrentPixelId;
    delete window.__siteMetaPixelLifecycleInstalled;
    delete window.__siteFbSdkLoaded;
    delete window._sitePageViewEventId;
    delete window.__sitePageViewTracked;

    window.history.replaceState({}, "", "https://example.com/");
  });

  it("fires and stores a first-load PageView when fbq is ready", () => {
    const callMethod = vi.fn();
    const fbq = vi.fn((...args: any[]) => callMethod(...args));
    fbq.callMethod = callMethod;
    window.fbq = fbq;

    ensureSitePixelBootstrap("123");

    const eventId = getSiteTrackedPageViewEventId("123", window.location.href);

    expect(callMethod).toHaveBeenCalledWith("track", "PageView", {}, { eventID: eventId });
    expect(eventId).toMatch(/^eid_/);
  });

  it("waits for sdk readiness before firing the first PageView", () => {
    ensureSitePixelBootstrap("123");

    expect(getSiteTrackedPageViewEventId("123", window.location.href)).toBe("");

    const sdkScript = document.querySelector('script[data-site-meta-pixel-sdk="true"]') as HTMLScriptElement;
    expect(sdkScript).toBeTruthy();

    const callMethod = vi.fn();
    window.fbq.callMethod = callMethod;
    window.__siteFbSdkLoaded = true;
    sdkScript.dispatchEvent(new Event("load"));

    const eventId = getSiteTrackedPageViewEventId("123", window.location.href);

    expect(callMethod).toHaveBeenCalledWith("track", "PageView", {}, { eventID: eventId });
    expect(eventId).toMatch(/^eid_/);
  });
});