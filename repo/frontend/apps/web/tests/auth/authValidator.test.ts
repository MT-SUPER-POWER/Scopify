import { describe, expect, test } from "bun:test";
import {
  cleanPhoneNumber,
  validateCaptcha,
  validatePassword,
  validatePhoneNumber,
} from "@/lib/auth/authValidator";

describe("authValidator", () => {
  describe("cleanPhoneNumber", () => {
    test("removes spaces, dashes, parentheses and dots", () => {
      expect(cleanPhoneNumber("138 0000 0000")).toBe("13800000000");
      expect(cleanPhoneNumber("138-0000-0000")).toBe("13800000000");
      expect(cleanPhoneNumber("(138) 0000-0000")).toBe("13800000000");
      expect(cleanPhoneNumber("138.0000.0000")).toBe("13800000000");
    });
  });

  describe("validatePhoneNumber", () => {
    test("rejects empty phone numbers", () => {
      expect(validatePhoneNumber("").valid).toBe(false);
      expect(validatePhoneNumber("   ").valid).toBe(false);
    });

    test("validates mainland China (+86) phone numbers", () => {
      expect(validatePhoneNumber("13800000000", "86").valid).toBe(true);
      expect(validatePhoneNumber("19912345678", "+86").valid).toBe(true);
      expect(validatePhoneNumber("17700001111", "86").valid).toBe(true);

      // Invalid cases
      expect(validatePhoneNumber("12800000000", "86").valid).toBe(false); // 2 is invalid second digit
      expect(validatePhoneNumber("1380000000", "86").valid).toBe(false); // 10 digits
      expect(validatePhoneNumber("138000000000", "86").valid).toBe(false); // 12 digits
      expect(validatePhoneNumber("abcdefghijk", "86").valid).toBe(false);
    });

    test("validates Hong Kong (+852) phone numbers", () => {
      expect(validatePhoneNumber("51234567", "852").valid).toBe(true);
      expect(validatePhoneNumber("91234567", "+852").valid).toBe(true);
      expect(validatePhoneNumber("1234567", "852").valid).toBe(false); // 7 digits
      expect(validatePhoneNumber("123456789", "852").valid).toBe(false); // 9 digits
    });

    test("validates Macau (+853) phone numbers", () => {
      expect(validatePhoneNumber("61234567", "853").valid).toBe(true);
      expect(validatePhoneNumber("1234567", "853").valid).toBe(false);
    });

    test("validates Taiwan (+886) phone numbers", () => {
      expect(validatePhoneNumber("0912345678", "886").valid).toBe(true);
      expect(validatePhoneNumber("912345678", "+886").valid).toBe(true);
      expect(validatePhoneNumber("123456", "886").valid).toBe(false);
    });

    test("validates international phone numbers (+1, +44, etc.)", () => {
      expect(validatePhoneNumber("4155552671", "1").valid).toBe(true);
      expect(validatePhoneNumber("7912345678", "44").valid).toBe(true);
      expect(validatePhoneNumber("123", "1").valid).toBe(false); // too short
    });
  });

  describe("validateCaptcha", () => {
    test("accepts 4-digit numeric verification codes", () => {
      expect(validateCaptcha("1234").valid).toBe(true);
      expect(validateCaptcha("0000").valid).toBe(true);
      expect(validateCaptcha("9999").valid).toBe(true);
    });

    test("rejects invalid verification codes", () => {
      expect(validateCaptcha("").valid).toBe(false);
      expect(validateCaptcha("123").valid).toBe(false); // 3 digits
      expect(validateCaptcha("12345").valid).toBe(false); // 5 digits
      expect(validateCaptcha("123a").valid).toBe(false); // non-numeric
    });
  });

  describe("validatePassword", () => {
    test("accepts valid passwords (6-32 chars)", () => {
      expect(validatePassword("123456").valid).toBe(true);
      expect(validatePassword("secure_password_123!").valid).toBe(true);
    });

    test("rejects invalid passwords", () => {
      expect(validatePassword("").valid).toBe(false);
      expect(validatePassword("12345").valid).toBe(false); // too short
      expect(validatePassword("a".repeat(33)).valid).toBe(false); // too long
    });
  });
});
