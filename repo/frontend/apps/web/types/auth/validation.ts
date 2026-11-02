export type PhoneValidationError =
  | "phone_required"
  | "phone_invalid_cn"
  | "phone_invalid_hk"
  | "phone_invalid_mo"
  | "phone_invalid_tw"
  | "phone_invalid_intl";

export type CaptchaValidationError = "captcha_required" | "captcha_invalid_format";

export type PasswordValidationError = "password_required" | "password_invalid_length";

export interface ValidationResult<E extends string = string> {
  valid: boolean;
  error?: E;
  message: string;
}
