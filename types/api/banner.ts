export interface NeteaseBanner {
  encodeId?: string | number;
  imageUrl?: string;
  pic?: string;
  targetId?: number;
  targetType?: number;
  typeTitle?: string;
  url?: string;
}

export interface BannerResponse {
  banners: NeteaseBanner[];
  code: number;
}
