import { describe, it, expect } from "vitest";
import { isValidAzPhone, isValidIntlPhone } from "./format.js";

describe("phone validation", () => {
  it("accepts +994 with 9 digits only", () => {
    expect(isValidAzPhone("+994501234567")).toBe(true);
    expect(isValidAzPhone("+99450123456")).toBe(false);
    expect(isValidAzPhone("")).toBe(false);
  });
  it("accepts international numbers with 10–15 digits", () => {
    expect(isValidIntlPhone("+994501234567")).toBe(true);
    expect(isValidIntlPhone("+12345")).toBe(false);
    expect(isValidIntlPhone("")).toBe(false);
  });
});

import { isProfileComplete } from "./format.js";

describe("isProfileComplete", () => {
  it("requires both phone and WhatsApp", () => {
    expect(isProfileComplete({ phone: "+994501234567", whatsapp: "+994501234567" })).toBe(true);
    expect(isProfileComplete({ phone: "+994501234567", whatsapp: "" })).toBe(false);
    expect(isProfileComplete({ phone: "", whatsapp: "+994501234567" })).toBe(false);
    expect(isProfileComplete(null)).toBe(false);
  });
});
