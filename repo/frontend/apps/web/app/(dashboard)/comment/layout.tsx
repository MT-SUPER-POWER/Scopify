import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "评论",
  description: "查看歌曲评论与讨论",
};

export default function CommentLayout({
  children,
  header,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-surface-raised pb-12 font-sans text-content">
      {header}
      <div className="hero-content-transition relative z-10 px-6 pt-6 md:px-8 md:pt-8 lg:px-10 xl:px-12">
        <div className="max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
