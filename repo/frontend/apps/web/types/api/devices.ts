export interface RawLoginDevice {
  deviceKey?: string | number;
  deviceName?: string | null;
  os?: string | null;
  hardwareTypeCode?: string | null;
  ifLoginDevice?: boolean;
  lastActiveTime?: number | string | null;
  region?: string | null;
  loginPlace?: string | null;
  loginType?: string | null;
}

export interface DeviceActionResponse {
  code: number;
  message?: string;
  msg?: string;
}

export interface LoginDevicesResponse extends DeviceActionResponse {
  data?: {
    userDeviceList?: RawLoginDevice[];
    userDeviceLimitInfoDTO?: {
      currentNum?: number;
      deviceLimit?: number;
    } | null;
  };
}

export interface KickoffDeviceParams {
  deviceKey: string;
  captcha?: string;
}
