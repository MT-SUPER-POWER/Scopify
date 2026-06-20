import type { Metadata } from "next";
import CommentPage from "@/components/comment-page/CommentPage";

export const metadata: Metadata = {
  title: "评论",
  description: "查看歌曲评论与讨论",
};

export default function Page() {
  return <CommentPage />;
}
