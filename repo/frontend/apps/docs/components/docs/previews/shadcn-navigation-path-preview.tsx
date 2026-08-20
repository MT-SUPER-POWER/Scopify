"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@scopify/ui/shadcn/components/breadcrumb";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@scopify/ui/shadcn/components/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@scopify/ui/shadcn/components/tabs";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnNavigationPathPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-breadcrumb":
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#library">音乐库</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#playlists">歌单</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>每日推荐</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    case "shadcn-pagination":
      return (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#previous" />
            </PaginationItem>
            {[1, 2, 3].map((page) => (
              <PaginationItem key={page}>
                <PaginationLink href={`#page-${page}`} isActive={page === 2}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#next" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
    case "shadcn-tabs":
      return (
        <Tabs defaultValue="songs" className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="songs">歌曲</TabsTrigger>
            <TabsTrigger value="albums">专辑</TabsTrigger>
            <TabsTrigger value="artists">艺人</TabsTrigger>
          </TabsList>
          <TabsContent value="songs" className="rounded-lg border p-4 text-sm">
            128 首已收藏歌曲
          </TabsContent>
          <TabsContent value="albums" className="rounded-lg border p-4 text-sm">
            24 张已收藏专辑
          </TabsContent>
          <TabsContent value="artists" className="rounded-lg border p-4 text-sm">
            16 位关注艺人
          </TabsContent>
        </Tabs>
      );
  }
}
