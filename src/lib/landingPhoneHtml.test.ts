import { describe, expect, it } from "vitest";
import { landingPhoneValidationScript, normalizeLandingPhoneHtml } from "@/lib/landingPhoneHtml";

describe("normalizeLandingPhoneHtml", () => {
  it("forces phone inputs to allow up to 15 digits", () => {
    const input = '<input type="tel" name="customer_phone" maxlength="11" pattern="01[3-9][0-9]{8}" />';

    const normalized = normalizeLandingPhoneHtml(input);

    expect(normalized).toContain('maxlength="15"');
    expect(normalized).toContain('inputmode="tel"');
    expect(normalized).not.toContain('pattern=');
  });

  it("patches legacy inline truncation scripts", () => {
    const script = "this.value=this.value.replace(/\\D/g,'').slice(0,11)";

    const normalized = normalizeLandingPhoneHtml(`<input name="phone" oninput="${script}" />`);

    expect(normalized).toContain("slice(0,15)");
  });

  it("converts numeric phone inputs to tel", () => {
    const input = '<input type="number" id="phone-field" />';

    const normalized = normalizeLandingPhoneHtml(input);

    expect(normalized).toContain('type="tel"');
    expect(normalized).toContain('maxlength="15"');
  });

  it("uses a document.write-safe country code regex in the runtime validator", () => {
    expect(landingPhoneValidationScript).toContain("replace(/^[+]?880/, '0')");
  });

  it("does not observe attributes in the runtime patcher", () => {
    expect(landingPhoneValidationScript).toContain("childList: true");
    expect(landingPhoneValidationScript).not.toContain("attributes:");
  });

  it("scopes runtime observation away from document.documentElement", () => {
    expect(landingPhoneValidationScript).toContain("observe(document.body");
    expect(landingPhoneValidationScript).not.toContain("observe(document.documentElement");
  });
});