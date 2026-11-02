/**
 * 社交页（动态流、动态详情、个人主页）与其弹窗共用的 Tailwind 类名。
 * 只收录被多个文件复用的组合；单处使用的样式直接写在组件里。
 * 分隔线统一用 border-foreground/10（动态浮层内为 /9）。
 */
import { cn } from "@/lib/utils";

/** 页面与弹窗共有的交互约定：按钮指针、禁用态、键盘焦点环，以及减少动态效果时关闭动画。 */
const interactiveClass =
  "[&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-45 [&_:is(button,a,input,textarea,select):focus-visible]:outline-2 [&_:is(button,a,input,textarea,select):focus-visible]:outline-offset-4 [&_:is(button,a,input,textarea,select):focus-visible]:outline-primary motion-reduce:**:animate-none! motion-reduce:**:transition-none!";

/** 社交页根容器：也是 @container 查询的参照宽度。 */
export const socialPageClass = `${interactiveClass} @container relative isolate min-h-full px-7 pt-[88px] pb-12 text-foreground [&_a]:no-underline max-[768px]:px-4 max-[768px]:pt-[78px] max-[768px]:pb-9`;

/** 动态流页面的内边距，与 socialPageClass 合并使用。 */
export const socialStreamPageClass =
  "px-[clamp(24px,4vw,64px)] pt-3 pb-10 max-[768px]:px-5 max-[768px]:pt-3 max-[768px]:pb-8";

/** 个人主页的内边距，与 socialPageClass 合并使用。 */
export const socialProfilePageClass = "px-[clamp(20px,3vw,48px)] pt-10 pb-12";

/**
 * 社交弹窗的 DialogContent。弹窗里的发布框不画分隔线（发布框只出现在弹窗与个人主页动态栏）。
 */
export const socialDialogClass = `${interactiveClass} max-h-[85dvh] overflow-y-auto bg-popover text-foreground`;

export const socialMutedClass = "text-[13px] text-muted-foreground";
export const socialRowClass = "flex items-center gap-2.5";
export const socialBetweenClass = "flex items-center justify-between gap-3";
export const socialSectionTitleClass =
  "mb-4 flex items-center justify-between gap-2.5 text-[14px] font-bold";
/** 个人主页「概览」里的栏目标题：标题更大，间距更紧。 */
export const profileSectionTitleClass = cn(
  socialSectionTitleClass,
  "mb-3.5 [&_h2]:text-[20px] [&_h2]:font-[750] [&_h2]:tracking-[-0.02em]",
);

export const socialButtonClass =
  "inline-flex min-h-9 items-center justify-center gap-[7px] rounded-full border border-foreground/10 bg-transparent px-5 py-2 text-[13px] font-[650] whitespace-nowrap hover:bg-secondary";
export const socialPrimaryClass =
  "border-transparent bg-primary text-primary-foreground hover:bg-[color:color-mix(in_srgb,var(--primary)_90%,var(--foreground))]";
export const socialDangerClass = "text-destructive";
export const socialIconButtonClass =
  "inline-flex size-[34px] shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground [&_svg]:size-[18px]";
export const socialTextButtonClass = "text-[13px] text-muted-foreground hover:text-primary";
export const socialCounterClass = "text-[11px] whitespace-nowrap text-muted-foreground";
export const socialTextareaClass =
  "max-h-60 min-h-[76px] w-full resize-y bg-transparent px-0 py-[5px] text-[16px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground placeholder:opacity-80";

/** 头像：默认 48px，窄屏 38px；尺寸类与 SocialAvatar 的 size / className 合并。 */
export const socialAvatarClass =
  "inline-flex flex-[0_0_auto] items-center justify-center overflow-hidden rounded-full bg-secondary text-muted-foreground [&_img]:size-full [&_img]:object-cover";
export const socialAvatarSizeClass = "size-12 max-[768px]:size-[38px]";
export const socialSmallAvatarSizeClass = "size-9 max-[768px]:size-[38px]";
/** 个人主页头部的大头像，随容器宽度缩小。 */
export const profileHeroAvatarClass =
  "size-48 border-0 shadow-[0_8px_40px_rgb(0_0_0/0.4)] @max-[1100px]:size-[148px] @max-[500px]:size-28";

export const socialAuthorClass = "font-bold wrap-anywhere text-foreground hover:underline";

export const socialTabsClass = "flex overflow-x-auto";
export const socialTabClass =
  "relative inline-flex items-center whitespace-nowrap text-muted-foreground data-[active=true]:text-foreground";
/** 带下划线指示的页签（个人主页）。 */
export const socialUnderlineTabClass = `${socialTabClass} px-[5px] pt-3 pb-4 text-[15px] font-semibold data-[active=true]:after:absolute data-[active=true]:after:inset-x-0 data-[active=true]:after:bottom-0 data-[active=true]:after:h-[3px] data-[active=true]:after:rounded-[4px] data-[active=true]:after:bg-primary`;
export const profileTabsClass = `${socialTabsClass} min-h-14 gap-8 border-b border-foreground/10`;

export const socialEventBodyClass = "min-w-0 flex-1";
export const socialEventHeaderClass =
  "flex min-h-[25px] items-start gap-[9px] text-[14px] [&_time]:text-[12px] [&_time]:text-muted-foreground";
export const socialPostTextClass =
  "mt-1.5 mb-3 text-[15px] leading-[1.75] whitespace-pre-wrap wrap-anywhere";
export const socialQuoteClass = "my-2.5 rounded-[10px] border border-foreground/10 p-3.5";
/** 引用框内的正文字号略小。 */
export const socialQuoteTextClass = "[&_[data-slot=social-post-text]]:text-[14px]";
export const socialActionsClass = "mt-3 flex max-w-[410px] justify-between gap-2";
export const socialActionClass =
  "inline-flex min-h-9 min-w-9 items-center gap-2 rounded-full px-2.5 py-1.5 text-[12px] text-muted-foreground hover:bg-primary/8 hover:text-primary data-[active=true]:text-primary [&_svg]:size-[17px] data-[active=true]:[&_svg]:fill-current";
export const socialCommentClass = "flex gap-3 border-b border-foreground/10 py-5";

export const socialSearchClass =
  "my-[18px] flex items-center gap-2 rounded-full border border-foreground/10 bg-accent px-[15px] py-2.5 [&>svg]:size-[17px] [&>svg]:shrink-0 [&>svg]:text-muted-foreground";
export const socialSearchInputClass =
  "min-w-0 flex-1 border-0 bg-transparent text-[13px] text-foreground outline-none";

export const socialSegmentedClass = "inline-flex rounded-full bg-foreground/8 p-[3px]";
export const socialSegmentedButtonClass =
  "rounded-full px-3.5 py-[5px] text-[12px] font-[650] text-muted-foreground aria-pressed:bg-foreground/16 aria-pressed:text-foreground";

/* ---- 个人主页 ---- */
export const profileShellClass = "relative z-1 mx-auto max-w-[1480px] min-w-0";
export const profileHeroClass = "min-w-0 pb-7";
export const profileIdentityRowClass =
  "relative grid grid-cols-[192px_minmax(0,1fr)] items-end gap-7 @max-[1100px]:grid-cols-[148px_minmax(0,1fr)] @max-[1100px]:gap-5 @max-[500px]:grid-cols-[minmax(0,1fr)] @max-[500px]:gap-4";
export const profileIdentityTextClass = "min-w-0";
export const profileTitleRowClass =
  "mb-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2.5 @max-[780px]:grid-cols-[minmax(0,1fr)]";
export const profileNameSizeClass = "text-[length:clamp(32px,5cqw,64px)] @max-[500px]:text-[28px]";
export const profileHeroActionsClass = "flex flex-wrap gap-2.5";
export const profileMainClass = "min-w-0";
export const profileOverviewClass = "flex flex-col gap-11 pt-8 pb-2";
export const profileSectionClass = "min-w-0";
export const profileRankListClass =
  "grid list-none grid-flow-col grid-cols-2 grid-rows-[repeat(5,auto)] gap-x-7 @max-[780px]:grid-flow-row @max-[780px]:grid-cols-[minmax(0,1fr)] @max-[780px]:grid-rows-none";
export const profileRankRowClass =
  "flex w-full items-center gap-3.5 rounded-[8px] px-2.5 py-2 text-left";
export const profileRankCoverClass =
  "size-12 shrink-0 overflow-hidden rounded-[6px] bg-secondary [&_img]:size-full [&_img]:object-cover";
export const profileRankTextClass = "min-w-0 flex-1";
/** 歌单书架：每行 6 / 4 / 3 / 2 个，放不下的直接隐藏。 */
export const profileShelfClass =
  "grid grid-cols-6 gap-5 @max-[1100px]:grid-cols-4 @max-[1100px]:[&>:nth-child(n+5)]:hidden @max-[780px]:grid-cols-3 @max-[780px]:[&>:nth-child(n+4)]:hidden @max-[500px]:grid-cols-2 @max-[500px]:[&>:nth-child(n+3)]:hidden";
export const profilePlaylistTileClass = "min-w-0";
export const profilePlaylistCoverClass =
  "mb-3 flex aspect-square h-auto w-full shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-secondary [&_img]:size-full [&_img]:object-cover";

/* ---- 动态浮层评论（浮层与评论骨架共用） ---- */
export const postCommentClass = "mb-[22px] flex items-start gap-3";
export const postCommentAuthorClass = "text-[14px] font-normal text-muted-foreground";
export const postCommentTextClass =
  "mt-1 text-[14px] leading-[1.6] whitespace-pre-wrap wrap-anywhere";
export const postCommentTimeClass = "mt-1.5 block text-[12px] text-muted-foreground";
export const postCommentMetaClass =
  "mt-1.5 flex flex-wrap gap-x-[18px] gap-y-1 text-[12px] text-muted-foreground";
