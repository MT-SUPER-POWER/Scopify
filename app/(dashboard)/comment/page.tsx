"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { getSongDetail } from '@/lib/api/track';
import { useSearchParams } from 'next/navigation';
import { NeteaseComment } from '@/types/api/music';
import { getMusicComments } from '@/lib/api/comment';
import { CommentItem } from '@/components/Comment/CommentItem';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CommentInputBox } from '@/components/Comment/CommentInputBox';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LIMIT = 20;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CommentPage() {

  // 歌曲相关信息
  const searchParams = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const songId = searchParams.get("SongId") || searchParams.get("songId");
  const [songInfo, setSongInfo] = useState<any>(null);
  const [albumCover, setAlbumCover] = useState("https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop");
  const [replyTarget, setReplyTarget] = useState<NeteaseComment | null>(null); // 回复的目标评论

  // 分页与数据状态
  const [hotComments, setHotComments] = useState<NeteaseComment[]>([]);
  const [comments, setComments] = useState<NeteaseComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 数据获取逻辑
  const fetchComments = useCallback(async (currentOffset: number) => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const res = await getMusicComments({ id: songId!, limit: LIMIT, offset: currentOffset });
      if (currentOffset === 0 && res.data?.hotComments) {
        setHotComments(res.data.hotComments);
      }

      setComments(prev => {
        const fetchedComments = res.data?.comments || [];
        // console.log("Fetched comments:", fetchedComments);
        return currentOffset === 0 ? fetchedComments : [...prev, ...fetchedComments];
      });
      setTotal(res.data?.total || 0);
      setHasMore(res.data?.more || false);
      setOffset(currentOffset + LIMIT);
    } catch (error) {
      console.error("Failed to fetch comments", error);
      if (currentOffset === 0) {
        setComments([]); // 出错且是首页时，设为空数组防止 undefined 引起 map 报错
      }
    } finally {
      setIsLoading(false);
    }
  }, [songId, hasMore, isLoading]); // 添加 songId 依赖，防止 ID 变化时不更新数据

  // 歌曲信息获取，完善歌曲信息区域
  const fetchSongDetails = useCallback(async () => {
    if (!songId) return;
    try {
      const res = await getSongDetail(songId);
      if (res.data?.songs && res.data.songs.length > 0) {
        const song = res.data.songs[0];
        setSongInfo(song);
        if (song.al?.picUrl) {
          setAlbumCover(song.al.picUrl);
        }
      }
    } catch (error) {
      console.error("Failed to fetch song details", error);
    }
  }, [songId]);


  const toggleLike = (id: number, isHot: boolean) => {
    // 评论点赞/取消点赞接口对接
    const targetSet = isHot ? setHotComments : setComments;
    targetSet(prev => prev.map(c => {
      if (c.commentId === id) {
        const nextLiked = !c.liked;
        // 本地先更新，接口成功后再同步
        return {
          ...c,
          liked: nextLiked,
          likedCount: nextLiked ? c.likedCount + 1 : Math.max(0, c.likedCount - 1)
        };
      }
      return c;
    }));

    // 异步接口调用
    import('@/lib/api/comment').then(({ toggleLikeComments }) => {
      // type=0 歌曲，t=1点赞/0取消，cid=id
      const commentList = isHot ? hotComments : comments;
      const comment = commentList.find(c => c.commentId === id);
      if (!comment || !songId) return;
      const t = comment.liked ? 0 : 1;
      toggleLikeComments(songId, id, t, 0)
        .then(() => {
          toast.success(t === 1 ? "已点赞" : "已取消点赞");
        })
        .catch((err) => {
          toast.error("操作失败，请稍后再试");
          console.error("Failed to toggle like", err);
        });
    });
  };

  const deleteComment = (id: number) => {
    // console.log(`Deleting comment ${id}`);
    import('@/lib/api/comment').then(({ delComments }) => {
      delComments(songId!, id)
        .then(() => {
          // 删除本地评论
          setComments(prev => prev.filter(c => c.commentId !== id));
          setHotComments(prev => prev.filter(c => c.commentId !== id));
          toast.success("评论已删除");
        })
        .catch((err) => {
          console.error("Failed to delete comment", err);
          // toast.error("评论删除失败，请稍后再试");
        });
    });
  };

  const replyComment = (id: number) => {
    const allComments = [...hotComments, ...comments];
    const target = allComments.find(c => c.commentId === id);
    if (target) {
      setReplyTarget(target);
      const inputArea = document.querySelector('textarea');
      inputArea?.focus();
    }
  };

  const handleSubmitText = async (text: string) => {
    if (!songId || !text.trim() || text.length > 140) return false;

    try {
      if (replyTarget) {
        // 回复模式 (使用 replyComments 接口)
        const { replyComments } = await import('@/lib/api/comment');
        await replyComments(songId, replyTarget.commentId, text);
        toast.success("回复成功");
      } else {
        // 普通发布模式 (使用 addMusicComments 接口)
        const { addMusicComments } = await import('@/lib/api/comment');
        await addMusicComments(songId, text);
        toast.success("发布成功");
      }

      setReplyTarget(null);

      // 延迟刷新
      setTimeout(() => {
        setOffset(0);
        setHasMore(true);
        fetchComments(0);
      }, 500);
      return true;
    } catch (err) {
      console.error("Failed to submit comment", err);
      return false;
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Effect ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 初始加载
  useEffect(() => {
    fetchComments(0);
    fetchSongDetails();
  }, []);

  // NOTE: 触底加载逻辑
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchComments(offset);
        }
      },
      { threshold: 0.1 } // 目标元素露出 10% 时触发
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchComments, hasMore, isLoading, offset]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white font-sans">
      {/* 沉浸式背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-110"
        style={{ backgroundImage: `url(${albumCover})` }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/60 to-[#121212]/95" />

      {/* 滚动内容区 */}
      <div className="relative z-10 h-full overflow-y-auto scrollbar-hide mt-12">
        <div className="max-w-4xl mx-auto px-8 py-12">

          {/* 头部：歌曲信息 */}
          <div className="flex items-center gap-10 mb-12">
            <img src={albumCover} alt="Cover" className="w-42 h-42 rounded-md shadow-2xl transition-all duration-700" />
            <div>
              <span className="px-2 py-1 text-xs font-bold bg-white/10 text-white rounded mb-3 inline-block">单曲</span>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                {songInfo?.name || "加载中..."}
              </h1>
              <div className="text-sm text-[#B3B3B3] flex items-center gap-2">
                <span>专辑: <span className="text-white hover:underline cursor-pointer">
                  {songInfo?.al?.name || "..."}
                </span></span>
                <span>•</span>
                <span>歌手: <span className="text-white hover:underline cursor-pointer">
                  {songInfo?.ar?.map((a: any) => a.name).join(" / ") || "..."}
                </span></span>
              </div>
            </div>
          </div>

          {/* 评论输入区 */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold">
                All Comments
                <span className="ml-1 text-sm font-normal text-[#B3B3B3]">
                  {total > 0 ? total.toLocaleString() : ''}
                </span>
              </h2>
            </div>
          </div>

          {/* 独立提取的输入框 */}
          <CommentInputBox
            replyTarget={replyTarget}
            onCancelReply={() => setReplyTarget(null)}
            onSubmit={handleSubmitText}
          />

          {/* 热评 */}
          {hotComments.length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">Hot Comments</h3>
              <div className="space-y-6">
                {hotComments.map((comment) => (
                  <CommentItem
                    key={`hot-${comment.commentId}`}
                    comment={comment}
                    isHot={true}
                    onLike={toggleLike}
                    onDelete={deleteComment}
                    onReply={replyComment}
                  />
                ))}
              </div>
            </div>)}

          {/* 最新评论区 */}
          <div>
            <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">Latest Comments</h3>
            <div className="space-y-6">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem
                    key={`latest-${comment.commentId}`}
                    comment={comment}
                    isHot={false}
                    onLike={toggleLike}
                    onDelete={deleteComment}
                    onReply={replyComment}
                  />
                ))
              ) : !isLoading ? (
                <div className="text-center py-20 text-[#B3B3B3]">No comments yet, be the first to comment!</div>
              ) : null}
            </div>
          </div>

          {/* 触底加载指示器 */}
          <div ref={observerTarget} className="py-8 flex justify-center items-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
            ) : hasMore ? (
              <span className="text-[#B3B3B3] text-sm">向下滚动加载更多...</span>
            ) : (
              <span className="text-[#B3B3B3] text-sm">已经到底啦</span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
