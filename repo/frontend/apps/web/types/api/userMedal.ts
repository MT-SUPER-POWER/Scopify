export interface UserMedalResource {
  resId?: string | number | null;
  resourceType?: string | null;
  desUrl?: string | null;
  coverUrl?: string | null;
  title?: string | null;
  subTitle?: string | null;
  resourceTip?: string | null;
  resStatus?: number | null;
  actionTitle?: string | null;
}

export interface UserMedalPicDto {
  url?: string;
  height?: number | null;
  width?: number | null;
}

export interface UserMedalItem {
  medalCode: string;
  bizSceneId?: string | null;
  medalPicText?: string | null;
  sceneIds?: number[];
  medalName: string;
  medalPicUrl: string;
  levelMedalPicUrl?: string | null;
  entranceShowPicUrl?: string;
  medalLevel?: number | null;
  acceptCondition?: string;
  status: string;
  showProgress?: boolean;
  progressSort?: number;
  obtainTime?: number | null;
  progress?: number | null;
  userObtainProportion?: number | null;
  resource?: UserMedalResource | null;
  specialMedalType?: string | null;
  linearGradientTopColor?: string | null;
  linearGradientBottomColor?: string | null;
  homeTable?: string | null;
  lightImage?: string | null;
  particleImage?: string | null;
  backgroundLight?: string | null;
  shineEffect?: boolean;
  tips?: string | null;
  canWear?: boolean;
  shouldNotice?: boolean;
  showWillObtain?: boolean;
  wearPic?: string | null;
  wearPicV2?: string | null;
  wearPicDto?: UserMedalPicDto | null;
  centerBasePicUrl?: string | null;
  detailPage?: string | null;
  descriptionText?: string | null;
  rankText?: string | null;
  medalLevelAll?: number | null;
  sideBarGuideText?: string | null;
  timeAcceptMedal?: boolean;
  canAcceptTimeStart?: number;
  canAcceptTimeEnd?: number;
  showAfterAcceptTimeIfNotObtain?: boolean;
  artistName?: string | null;
  levelTitle?: string | null;
  levelTitleShort?: string | null;
  low?: unknown;
  high?: unknown;
  skipLevel?: boolean;
  wear?: boolean;
  newStyle?: boolean;
}

export interface UserMedalSubGroup {
  subGroupCode?: string | null;
  subGroupId?: string | null;
  subGroupTitle?: string | null;
  medals?: UserMedalItem[];
  obtainedTotal?: number | null;
  total?: number;
  hasMore?: boolean;
  nextPage?: unknown;
}

export interface UserMedalCategoryBlock {
  categoryCode?: string;
  categoryId?: string;
  categoryTitle?: string;
  medalVOS?: UserMedalItem[];
  subGroupList?: UserMedalSubGroup[];
  scene?: unknown;
}

export interface UserMedalData {
  avatar?: string;
  nickName?: string;
  showGuide?: boolean;
  canManageWear?: boolean;
  useMedalTabs?: boolean;
  medalTabs?: unknown[] | null;
  medalNum?: number;
  rankingPer?: string;
  obtainMedals?: UserMedalItem[];
  categoryMedalBlockVos?: UserMedalCategoryBlock[];
  musicMedalOperationVO?: unknown | null;
  newPageUIAb?: boolean;
}

export interface UserMedalResponse {
  code: number;
  data?: UserMedalData;
  message?: string;
  msg?: string;
}
