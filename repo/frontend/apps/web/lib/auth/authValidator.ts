import type {
  CaptchaValidationError,
  PasswordValidationError,
  PhoneValidationError,
  ValidationResult,
} from "@/types/auth/validation";

/**
 * 清除手机号中的空白、连字符、括号等冗余符号
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s().-]/g, "");
}

/**
 * 校验手机号格式
 * @param phone 用户输入的手机号
 * @param countryCode 国家/地区代码，默认 "86"
 */
export function validatePhoneNumber(
  phone: string,
  countryCode = "86",
): ValidationResult<PhoneValidationError> {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) {
    return {
      valid: false,
      error: "phone_required",
      message: "请输入手机号码",
    };
  }

  const code = countryCode.replace(/^\+/, "").trim();

  if (code === "86") {
    // 中国大陆：11 位数字，1 开头，第二位 3-9
    if (!/^1[3-9]\d{9}$/.test(cleaned)) {
      return {
        valid: false,
        error: "phone_invalid_cn",
        message: "请输入有效的 11 位中国大陆手机号",
      };
    }
    return { valid: true, message: "" };
  }

  if (code === "852") {
    // 中国香港：8 位数字
    if (!/^\d{8}$/.test(cleaned)) {
      return {
        valid: false,
        error: "phone_invalid_hk",
        message: "请输入有效的 8 位中国香港手机号",
      };
    }
    return { valid: true, message: "" };
  }

  if (code === "853") {
    // 中国澳门：8 位数字
    if (!/^\d{8}$/.test(cleaned)) {
      return {
        valid: false,
        error: "phone_invalid_mo",
        message: "请输入有效的 8 位中国澳门手机号",
      };
    }
    return { valid: true, message: "" };
  }

  if (code === "886") {
    // 中国台湾：9 或 10 位数字（通常为 09 开头或 9 开头）
    if (!/^(0?9)\d{8}$/.test(cleaned)) {
      return {
        valid: false,
        error: "phone_invalid_tw",
        message: "请输入有效的中国台湾手机号",
      };
    }
    return { valid: true, message: "" };
  }

  // 国际通用 E.164 规范：4 到 15 位纯数字
  if (!/^\d{4,15}$/.test(cleaned)) {
    return {
      valid: false,
      error: "phone_invalid_intl",
      message: "请输入有效的手机号码（4-15 位纯数字）",
    };
  }

  return { valid: true, message: "" };
}

export const CAPTCHA_VALIDITY_MS = 10 * 60 * 1000;

/**
 * 校验短信验证码（网易云固定 4 位数字）
 */
export function validateCaptcha(captcha: string): ValidationResult<CaptchaValidationError> {
  const cleaned = captcha.trim();
  if (!cleaned) {
    return {
      valid: false,
      error: "captcha_required",
      message: "请输入短信验证码",
    };
  }
  if (!/^\d{4}$/.test(cleaned)) {
    return {
      valid: false,
      error: "captcha_invalid_format",
      message: "请输入 4 位数字短信验证码",
    };
  }
  return { valid: true, message: "" };
}

/**
 * 校验登录密码（6-32 位）
 */
export function validatePassword(password: string): ValidationResult<PasswordValidationError> {
  if (!password) {
    return {
      valid: false,
      error: "password_required",
      message: "请输入密码",
    };
  }
  if (password.length < 6 || password.length > 32) {
    return {
      valid: false,
      error: "password_invalid_length",
      message: "密码长度需在 6-32 位之间",
    };
  }
  return { valid: true, message: "" };
}
