export interface UpdateUserProfilePayload {
  nickname: string;
  signature?: string;
  gender?: 0 | 1 | 2;
  birthday?: number;
  province?: number;
  city?: number;
}

export interface UpdateUserProfileResponse {
  code: number;
}
