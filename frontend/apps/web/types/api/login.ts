export interface ApiCodeResponse {
  code: number;
  message?: string;
}

export interface CellphoneLoginParams {
  captcha?: string;
  countrycode?: number | string;
  md5_password?: string;
  password?: string;
  phone: string;
}

export interface CellphoneLoginResponse extends ApiCodeResponse {
  cookie?: string;
  token?: string;
}

export type LoginQueryParams = Record<string, boolean | number | string>;

export interface LoginStatusResponse extends ApiCodeResponse {
  data?: {
    account?: {
      id: number;
    };
    profile?: {
      userId: number;
    };
  };
}

export interface QrCheckResponse extends ApiCodeResponse {
  cookie?: string;
}

export interface QrCreateResponse extends ApiCodeResponse {
  data: {
    qrimg: string;
    qrurl: string;
  };
}

export interface QrKeyResponse extends ApiCodeResponse {
  data: {
    code: number;
    unikey: string;
  };
}
