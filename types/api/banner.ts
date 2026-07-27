export interface NeteaseBanner {
  imageUrl?: string;
  pic?: string;
  targetId?: number;
  typeTitle?: string;
}

export interface BannerResponse {
  banners: NeteaseBanner[];
  code: number;
}
