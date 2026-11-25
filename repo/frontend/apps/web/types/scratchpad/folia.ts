import type { PlayerTrack } from "@/types/player/model";
import type { SongNoteTag, SongNoteComment, SongNoteSort } from "./model";
import type { ScratchpadShapeKind } from "@/lib/scratchpad/scratchpadLook";
import type { CSSProperties, ReactNode, Ref } from "react";
import type { Transition } from "framer-motion";
import type { ScratchpadSection as ScratchpadTab } from "./components";

export type ScratchpadShapeProps = {
  kind: ScratchpadShapeKind;
  size: number;
  /** 填充色；线框时给 'none'。 */
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
};

export type ScratchpadBandProps = {
  tab: ScratchpadTab;
  /** 01 / 02 / 03。 */
  index: string;
  title: string;
  count: number;
  /** panel：左缘面板顶上；full：展开整页；row：三行总览里的一行。 */
  variant?: "panel" | "full" | "row";
  /** 展开整页与三行总览：标题下面一行小字（这一页的说明）。 */
  meta?: string;
  /** 展开整页与三行总览：条的宽度（整张纸那么宽），装饰按它撒。 */
  width?: number;
  /** 展开整页：右端按钮的空位。 */
  actionsRef?: Ref<HTMLDivElement>;
  /** 编号后面那个带下划线的链接：展开整页里是「‹ 三行总览」，三行总览里是「展开整页 ›」。 */
  link?: { label: string; onClick: () => void };
};

export type ScratchpadSlimProps = {
  tab: ScratchpadTab;
  index: string;
  title: string;
  countLabel: string;
  /** 右端「展开整页 ›」的字（左缘面板里不显示，scratchpad.css）。 */
  openLabel: string;
  /** 读屏念的名字；缺省是「展开整页 · 标题」（面板里点它是换页，交进来「标题 · 首数」）。 */
  ariaLabel?: string;
  onOpen: (tab: ScratchpadTab) => void;
};

export type PaperFrame = { top: number; left: number; width: number; height: number };

/** 一条纸这一次怎么动：直接挪到新的框，或绕一圈（先往上出去、再从下面上来）；里面那一面什么时候换。 */
export type PaperMotion = {
  key: string;
  animate: Record<string, number | string | (number | string | null)[]>;
  transition: Transition;
  faceIn: Transition;
  faceOut: Transition;
};

export type PaperMotionOptions = {
  calm: boolean;
  /** 绕一圈时离开视口要到哪（纸的上沿，再减去纸自己的高）、从哪回来（纸的上沿）。 */
  above: number;
  below: number;

  settle?: Record<string, string>;
};

export type ScratchpadPanelProps = {
  tab: ScratchpadTab;
  counts: Record<ScratchpadTab, number>;

  /** 写过评论或打过标签的歌有几首。 */

  /** 底部细纸带的上下次序（与展开整页共用，useSlimOrder）。 */
  slimOrder: readonly ScratchpadTab[];
  onSelectTab: (tab: ScratchpadTab) => void;
  onClose: () => void;
  expandLabel: string;

  onExpand: () => void;

  /** 信息条下面那句放大的问候（「评论」页不要：那里是歌曲头，没歌时它自己写问候）。 */
  showIntro?: boolean;
  children: ReactNode;
};

export type ScratchpadSheetProps = {
  tab: ScratchpadTab;
  notesCount: number;
  queueCount: number;
  commentsCount: number;
  /** 纸转几度（降低动态效果时 0）。 */
  tilt: number;
  /** 降低动态效果：信息条不挪，只淡入淡出。 */
  calm: boolean;
  /** 左下角细纸带的上下次序（与左缘面板共用，useSlimOrder）。 */
  slimOrder: readonly ScratchpadTab[];
  /** 换到这一页（细纸带、总览里的「展开整页 ›」）。 */
  onOpenPage: (tab: ScratchpadTab) => void;
  /** 收回左缘的面板。 */
  onCollapse: () => void;
  collapseLabel: string;
  collapseRef?: Ref<HTMLButtonElement>;
  /** 三行总览：给了就画它（参数是纸的宽度与窗口高度），不画这一页。 */
  overview?: ((sheetWidth: number, viewHeight: number) => ReactNode) | null;
  /** 展开整页的信息条上「‹ 三行总览」。 */
  onShowOverview?: () => void;
  children: ReactNode;
};

export type ScratchpadCommentsHeadProps = {
  song: PlayerTrack;
  songKey: string;
  /** 看的就是正在播的那首。 */
  isPlaying: boolean;
  tags: readonly string[];
  tagNames: ReadonlyMap<string, SongNoteTag>;
  comments: readonly SongNoteComment[];
  /** 歌长（秒）：刻痕按它摆。 */
  duration: number;
  onSeek: (at: number) => void;
  onPlay: () => void;
  /** 在看另一首时：回到正在播放。 */
  onBackToPlaying?: () => void;
};

export type CommentItemProps = {
  trackKey: string;
  comment: SongNoteComment;
  /** 时间块能不能点（看的是正在播的那首）。 */
  canSeek: boolean;
  onSeek: (at: number) => void;
};

export type ScratchpadCommentListProps = {
  trackKey: string;
  comments: readonly SongNoteComment[];
  sort: SongNoteSort;
  canSeek: boolean;
  onSeek: (at: number) => void;
  /** 新写的那一条：滚过去。 */
  scrollToId: string | null;
};

export type ScratchpadCommentComposerProps = {
  song: PlayerTrack;
  draft: string;
  setDraft: (text: string) => void;
  /** 看的就是正在播的那首：能挂时刻。 */
  canPin: boolean;
  /** 记下了一条（列表滚过去）。 */
  onWritten: (id: string) => void;
};
