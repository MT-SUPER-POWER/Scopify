"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Share2, MoreHorizontal, Hash, AtSign, Smile, Loader2 } from 'lucide-react';
import { getMusicComments, getSongDetail } from '@/lib/api/track';
import { useSearchParams } from 'next/navigation';
import { NeteaseComment } from '@/types/api/music';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CommentPage() {

  const [inputText, setInputText] = useState('');
  // 歌曲相关信息
  const searchParams = useSearchParams();
  const songId = searchParams.get("SongId") || searchParams.get("songId");
  const [songInfo, setSongInfo] = useState<any>(null);
  const [albumCover, setAlbumCover] = useState("https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop");

  // 分页与数据状态
  const [hotComments, setHotComments] = useState<NeteaseComment[]>([]);
  const [comments, setComments] = useState<NeteaseComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const LIMIT = 20;
  const observerTarget = useRef<HTMLDivElement>(null);

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


  // TODO: 歌曲信息获取，完善歌曲信息区域
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

  // 初始加载
  useEffect(() => {
    fetchComments(0);
    fetchSongDetails();
  }, []);

  // ==========================================
  // 3. NOTE: 触底加载逻辑 (IntersectionObserver)
  // ==========================================
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

  // 点赞模拟功能
  const toggleLike = (id: number, isHot: boolean) => {
    const targetSet = isHot ? setHotComments : setComments;
    targetSet(prev => prev.map(c => {
      if (c.commentId === id) {
        return { ...c, liked: !c.liked, likedCount: c.liked ? c.likedCount - 1 : c.likedCount + 1 };
      }
      return c;
    }));
  };

  // ==========================================
  // 4. 渲染单一评论项的组件 (代码复用)
  // ==========================================
  const CommentItem = ({ comment, isHot = false }: { comment: NeteaseComment, isHot?: boolean }) => (
    <div className="flex gap-4 group">
      <img
        src={comment.user.avatarUrl}
        alt={comment.user.nickname}
        className="w-10 h-10 rounded-full bg-neutral-800 object-cover mt-1 shrink-0 cursor-pointer"
      />
      <div className="flex-1 pb-6 border-b border-white/5 group-last:border-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-bold text-sm hover:underline cursor-pointer">{comment.user.nickname}</span>
          <span className="text-xs text-[#B3B3B3]">{comment.timeStr}</span>
        </div>
        <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* 回复引用区块 */}
        {comment.beReplied && comment.beReplied.length > 0 && (
          <div className="mt-3 pl-3 border-l-2 border-[#1DB954] bg-white/5 p-2 rounded-r-md">
            <span className="text-xs text-[#1DB954] font-bold mr-2">@{comment.beReplied[0].user.nickname}</span>
            <span className="text-xs text-[#B3B3B3] line-clamp-2">{comment.beReplied[0].content}</span>
          </div>
        )}

        {/* 操作栏 */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-xs font-semibold text-[#B3B3B3] hover:text-white transition-colors">
              回复
            </button>
          </div>

          <div className="flex items-center gap-6 text-[#B3B3B3]">
            <button className="flex items-center gap-1.5 hover:text-white transition-colors group/btn">
              <span className="text-xs hidden group-hover/btn:block">分享</span>
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleLike(comment.commentId, isHot)}
              className={`flex items-center gap-1.5 transition-colors ${comment.liked ? 'text-[#1DB954]' : 'hover:text-white'}`}
            >
              <span className="text-xs">{comment.likedCount > 0 ? comment.likedCount.toLocaleString() : ''}</span>
              <Heart className={`w-4 h-4 ${comment.liked ? 'fill-[#1DB954]' : ''}`} />
            </button>
            <button className="hover:text-white transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white font-sans selection:bg-[#1DB954] selection:text-white">
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
          <div className="mb-12">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold">全部评论 <span className="text-sm font-normal text-[#B3B3B3]">{total > 0 ? total.toLocaleString() : ''}</span></h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 focus-within:border-white/30 focus-within:bg-white/10 transition-all">
              <textarea
                rows={3}
                placeholder="说点什么吧"
                className="w-full bg-transparent text-white placeholder-[#B3B3B3] resize-none outline-none text-sm leading-relaxed"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <div className="flex gap-4 text-[#B3B3B3]">
                  <Hash className="w-5 h-5 hover:text-white cursor-pointer" />
                  <AtSign className="w-5 h-5 hover:text-white cursor-pointer" />
                  <Smile className="w-5 h-5 hover:text-white cursor-pointer" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[#B3B3B3]">{inputText.length}/1000</span>
                  <button
                    className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm px-6 py-2 rounded-full scale-100 hover:scale-105 transition-all disabled:opacity-50"
                    disabled={inputText.length === 0}
                  >
                    发布
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 精彩评论区 (如果有的话) */}
          {hotComments.length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">精彩评论</h3>
              <div className="space-y-6">
                {hotComments.map((comment) => (
                  <CommentItem key={`hot-${comment.commentId}`} comment={comment} isHot={true} />
                ))}
              </div>
            </div>
          )}

          {/* 最新评论区 */}
          <div>
            <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">最新评论</h3>
            <div className="space-y-6">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem key={`latest-${comment.commentId}`} comment={comment} isHot={false} />
                ))
              ) : !isLoading ? (
                <div className="text-center py-20 text-[#B3B3B3]">暂无评论，快来抢沙发吧~</div>
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
