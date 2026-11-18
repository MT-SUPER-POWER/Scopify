"use client";

import Link from "next/link";
import { Heart, ListMusic, Play } from "lucide-react";
import { musicResourceKey } from "@scopify/music-domain/identity";
import { Badge } from "@scopify/ui/shadcn/components/badge";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@scopify/ui/shadcn/components/card";
import {
  DEMO_IDENTITIES,
  DEMO_NETEASE_TRACK,
  DEMO_QQ_TRACK,
  DEMO_TRACKS,
} from "@/constants/provider-demo";
import { useProviderDemo } from "@/hooks/use-provider-demo";
import { ProviderTrackCard } from "./provider-track-card";

export function ProviderDemo() {
  const demo = useProviderDemo();
  const likedTracks = DEMO_TRACKS.filter(
    (track) => track.ref.provider === demo.identity.account.provider && demo.isLiked(track),
  );

  return (
    <>
      <header className="space-y-3">
        <Link
          href="/docs/multi-provider-demo"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          查看类型边界与目录说明
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">一个播放器，两套身份</h1>
          <Badge variant="outline">类型拆分最小样本</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          内容可以一起用，个人资产跟着身份走。切换两边身份、收藏样本歌曲，再观察侧栏和队列。
        </p>
        <p className="text-muted-foreground text-sm">
          全部为虚构数据，仅在本页内存中模拟；刷新页面重置，不登录平台、不写入真实资产，也不播放实际音频。
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="当前使用身份">
        {Object.values(DEMO_IDENTITIES).map((identity) => (
          <Button
            key={identity.account.provider}
            variant={
              demo.identity.account.provider === identity.account.provider ? "default" : "outline"
            }
            aria-pressed={demo.identity.account.provider === identity.account.provider}
            onClick={() => demo.setActiveProvider(identity.account.provider)}
          >
            {identity.providerLabel}
          </Button>
        ))}
        <span className="text-muted-foreground text-sm">
          两个来源始终保留，切换身份不移除内容。
        </span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="space-y-4" aria-label="当前身份的个人资产">
          <Card>
            <CardHeader>
              <CardTitle>我的音乐</CardTitle>
              <CardDescription>{demo.identity.name} · 随身份切换</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {demo.identity.playlistNames.map((name) => (
                <p key={name} className="flex items-center gap-2 text-sm">
                  <ListMusic aria-hidden="true" className="size-4" />
                  {name}
                </p>
              ))}
              {demo.identity.cloudSupported ? <p className="text-sm">个人云盘</p> : null}
              <div className="border-t pt-3">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Heart aria-hidden="true" className="size-4" />
                  当前身份喜欢的歌曲
                </p>
                {likedTracks.length ? (
                  likedTracks.map((track) => (
                    <p key={musicResourceKey(track.ref)} className="text-muted-foreground text-sm">
                      {track.title}
                    </p>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">还未收藏样本歌曲。</p>
                )}
              </div>
            </CardContent>
          </Card>
          <p className="text-muted-foreground text-xs leading-relaxed">
            身份只控制个人歌单、喜欢和专属功能。切换到不支持云盘的身份时，云盘入口隐藏。
          </p>
        </aside>

        <div className="space-y-6">
          <section className="space-y-3" aria-labelledby="shared-catalog-title">
            <h2 id="shared-catalog-title" className="text-lg font-semibold">
              可组合的公共曲目
            </h2>
            <div className="grid gap-3 xl:grid-cols-2">
              {DEMO_TRACKS.map((track) => (
                <ProviderTrackCard
                  key={musicResourceKey(track.ref)}
                  track={track}
                  account={demo.identity.account}
                  liked={demo.isLiked(track)}
                  onToggleLike={() => demo.toggleLike(track)}
                  onEnqueue={() => demo.enqueue(track)}
                />
              ))}
            </div>
          </section>
          <Card>
            <CardHeader>
              <CardTitle>混合队列</CardTitle>
              <CardDescription>不会随身份切换重置；同一首歌也可以多次加入。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {demo.queue.length ? (
                demo.queue.map((item) => (
                  <div
                    key={item.queueItemId}
                    className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="min-w-0 flex-1 text-sm">{item.track.title}</span>
                    <Badge variant="secondary">
                      {DEMO_IDENTITIES[item.track.ref.provider].providerLabel}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-pressed={demo.playingItem?.queueItemId === item.queueItemId}
                      onClick={() => demo.setPlayingQueueItemId(item.queueItemId)}
                    >
                      <Play aria-hidden="true" className="size-3" />
                      {demo.playingItem?.queueItemId === item.queueItemId
                        ? "模拟播放中"
                        : "模拟播放"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">从上方添加任一来源的歌曲。</p>
              )}
              <p className="pt-3 text-sm" role="status">
                当前模拟曲目：{demo.playingItem?.track.title ?? "未选择"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <details className="rounded-xl border p-5">
        <summary className="cursor-pointer font-medium">
          查看 API 类型 → 领域类型 → 界面类型
        </summary>
        <p className="text-muted-foreground my-3 text-sm">
          两个原始歌曲的数字 ID 都是 101，但 QQ 用 MID
          定位，资源键不会冲突。领域歌曲不携带当前账号的红心、凭证或播放链接。
        </p>
        <div className="grid gap-4 text-xs lg:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium">平台 API 数据</h3>
            <pre className="bg-muted overflow-auto rounded-lg p-4">
              {JSON.stringify({ netease: DEMO_NETEASE_TRACK, qq: DEMO_QQ_TRACK }, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="mb-2 font-medium">共同的 MusicTrack</h3>
            <pre className="bg-muted overflow-auto rounded-lg p-4">
              {JSON.stringify(DEMO_TRACKS, null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </>
  );
}
