import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "评论",
  description: "查看歌曲评论与讨论",
};

export default function CommentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
