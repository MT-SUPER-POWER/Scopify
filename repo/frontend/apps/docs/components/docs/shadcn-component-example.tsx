"use client";

import { ShadcnExample } from "@/components/docs/shadcn-example";
import { ShadcnPreview } from "@/components/docs/shadcn-preview";
import type { ShadcnComponentExampleProps, ShadcnPreviewName } from "@/types/component-docs";

type ShadcnComponentSlug = Exclude<ShadcnPreviewName, `shadcn-${string}`>;

const codeByName: Partial<Record<ShadcnComponentSlug, string>> = {
  accordion: `<Accordion type="single" collapsible defaultValue="lyrics">
  <AccordionItem value="lyrics">
    <AccordionTrigger>歌词信息</AccordionTrigger>
    <AccordionContent>歌词支持逐字时间轴与桌面歌词。</AccordionContent>
  </AccordionItem>
</Accordion>`,
  alert: `<Alert>
  <Info />
  <AlertTitle>同步完成</AlertTitle>
  <AlertDescription>你的播放列表已更新。</AlertDescription>
</Alert>`,
  "alert-dialog": `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">删除歌单</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除？</AlertDialogTitle>
      <AlertDialogDescription>此操作无法撤销。</AlertDialogDescription>
    </AlertDialogHeader>
  </AlertDialogContent>
</AlertDialog>`,
  "aspect-ratio": `<AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
  <img src="/cover.jpg" alt="专辑封面" className="size-full object-cover" />
</AspectRatio>`,
  attachment: `<Attachment className="max-w-sm">
  <AttachmentPreview type="image" />
  <AttachmentInfo>
    <AttachmentTitle>album-cover.png</AttachmentTitle>
    <AttachmentDescription>2.4 MB</AttachmentDescription>
  </AttachmentInfo>
</Attachment>`,
  avatar: `<Avatar className="size-14">
  <AvatarImage src="/avatar.png" alt="Scopify Listener" />
  <AvatarFallback>SC</AvatarFallback>
  <AvatarBadge className="bg-emerald-500" />
</Avatar>`,
  badge: `<div className="flex gap-2">
  <Badge>推荐</Badge>
  <Badge variant="secondary">已收藏</Badge>
  <Badge variant="outline">无损</Badge>
</div>`,
  breadcrumb: `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">首页</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>播放列表</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  bubble: `<Bubble variant="default">
  <BubbleContent>根据你的最近播放，推荐这张专辑。</BubbleContent>
</Bubble>`,
  "button-group": `<ButtonGroup>
  <Button variant="outline">上一首</Button>
  <Button>播放</Button>
  <ButtonGroupSeparator />
  <Button variant="outline" size="icon" aria-label="更多">
    <MoreHorizontal />
  </Button>
</ButtonGroup>`,
  calendar: `<Calendar mode="single" selected={date} onSelect={setDate} />`,
  card: `<Card>
  <CardHeader>
    <CardTitle>每日推荐</CardTitle>
    <CardDescription>根据你的收听偏好生成</CardDescription>
  </CardHeader>
  <CardContent>30 首歌曲 · 今天更新</CardContent>
</Card>`,
  checkbox: `<div className="flex items-center gap-3">
  <Checkbox id="download" defaultChecked />
  <Label htmlFor="download">自动下载喜欢的歌曲</Label>
</div>`,
  collapsible: `<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">显示更多信息</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>这里是补充内容。</CollapsibleContent>
</Collapsible>`,
  combobox: `<Combobox items={["流行", "摇滚", "爵士"]}>
  <ComboboxInput placeholder="搜索音乐风格" />
  <ComboboxContent>
    <ComboboxList>
      <ComboboxItem value="流行">流行</ComboboxItem>
      <ComboboxItem value="摇滚">摇滚</ComboboxItem>
      <ComboboxItem value="爵士">爵士</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
  command: `<Command className="max-w-sm rounded-lg border">
  <CommandInput placeholder="搜索音乐..." />
  <CommandList>
    <CommandEmpty>没有找到结果。</CommandEmpty>
    <CommandGroup heading="快捷操作">
      <CommandItem>播放最近歌曲</CommandItem>
      <CommandItem>打开收藏</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
  "context-menu": `<ContextMenu>
  <ContextMenuTrigger className="rounded-lg border p-8">右键打开菜单</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>添加到队列</ContextMenuItem>
    <ContextMenuItem>查看专辑</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  dialog: `<Dialog>
  <DialogTrigger asChild><Button>创建歌单</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>创建新歌单</DialogTitle>
      <DialogDescription>输入名称后即可创建私人歌单。</DialogDescription>
    </DialogHeader>
    <Input placeholder="歌单名称" />
  </DialogContent>
</Dialog>`,
  direction: `<DirectionProvider dir="rtl">
  <div dir="rtl">从右向左的内容</div>
</DirectionProvider>`,
  drawer: `<Drawer>
  <DrawerTrigger asChild><Button>打开播放器</Button></DrawerTrigger>
  <DrawerContent><DrawerHeader><DrawerTitle>正在播放</DrawerTitle></DrawerHeader></DrawerContent>
</Drawer>`,
  "dropdown-menu": `<DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="outline">更多操作</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>添加到队列</DropdownMenuItem>
    <DropdownMenuItem>分享</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
  empty: `<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon"><ListMusic /></EmptyMedia>
    <EmptyTitle>播放队列为空</EmptyTitle>
    <EmptyDescription>从歌曲或歌单中添加音乐开始播放。</EmptyDescription>
  </EmptyHeader>
  <EmptyContent><Button>浏览推荐</Button></EmptyContent>
</Empty>`,
  field: `<Field>
  <FieldLabel htmlFor="playlist">歌单名称</FieldLabel>
  <Input id="playlist" />
  <FieldDescription>名称会显示在你的公开主页中。</FieldDescription>
</Field>`,
  form: `<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField name="playlist" control={form.control} render={({ field }) => (
      <FormItem><FormLabel>歌单名称</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
    )} />
    <Button type="submit">保存歌单</Button>
  </form>
</Form>`,
  "hover-card": `<HoverCard>
  <HoverCardTrigger asChild><Button variant="link">查看艺人</Button></HoverCardTrigger>
  <HoverCardContent>周杰伦 · 28 张专辑</HoverCardContent>
</HoverCard>`,
  input: `<Input type="search" placeholder="搜索音乐" aria-label="搜索音乐" />`,
  "input-group": `<InputGroup>
  <InputGroupInput placeholder="搜索歌单" />
  <InputGroupAddon><Search /></InputGroupAddon>
</InputGroup>`,
  "input-otp": `<InputOTP maxLength={6}>
  <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /></InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
</InputOTP>`,
  item: `<Item variant="outline">
  <ItemMedia variant="icon"><Music2 /></ItemMedia>
  <ItemContent><ItemTitle>夜曲</ItemTitle><ItemDescription>周杰伦 · 十一月的萧邦</ItemDescription></ItemContent>
  <ItemActions><Button size="icon-sm" variant="ghost" aria-label="播放"><Play /></Button></ItemActions>
</Item>`,
  kbd: `<KbdGroup><Kbd>Ctrl</Kbd><span>+</span><Kbd>K</Kbd></KbdGroup>`,
  label: `<Label htmlFor="email">邮箱地址</Label>
<Input id="email" type="email" />`,
  menubar: `<Menubar>
  <MenubarMenu><MenubarTrigger>文件</MenubarTrigger><MenubarContent><MenubarItem>新建歌单</MenubarItem></MenubarContent></MenubarMenu>
</Menubar>`,
  message: `<Message>
  <MessageAvatar><Bot /></MessageAvatar>
  <MessageContent><MessageHeader>Scopify 助手</MessageHeader><MessageFooter>刚刚</MessageFooter></MessageContent>
</Message>`,
  "native-select": `<NativeSelect defaultValue="high">
  <NativeSelectOption value="standard">标准音质</NativeSelectOption>
  <NativeSelectOption value="high">极高音质</NativeSelectOption>
</NativeSelect>`,
  "navigation-menu": `<NavigationMenu>
  <NavigationMenuList><NavigationMenuItem><NavigationMenuLink href="/library">媒体库</NavigationMenuLink></NavigationMenuItem></NavigationMenuList>
</NavigationMenu>`,
  pagination: `<Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#" /></PaginationItem><PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem><PaginationItem><PaginationNext href="#" /></PaginationItem></PaginationContent></Pagination>`,
  popover: `<Popover><PopoverTrigger asChild><Button variant="outline">播放设置</Button></PopoverTrigger><PopoverContent>无缝播放与桌面歌词</PopoverContent></Popover>`,
  progress: `<Progress value={68} aria-label="下载进度 68%" />`,
  "radio-group": `<RadioGroup defaultValue="lossless" className="w-full max-w-xs">
  <div className="flex items-center gap-3">
    <RadioGroupItem value="standard" id="standard" />
    <Label htmlFor="standard">标准音质</Label>
  </div>
  <div className="flex items-center gap-3">
    <RadioGroupItem value="high" id="high" />
    <Label htmlFor="high">极高音质</Label>
  </div>
  <div className="flex items-center gap-3">
    <RadioGroupItem value="lossless" id="lossless" />
    <Label htmlFor="lossless">无损音质</Label>
  </div>
</RadioGroup>`,
  resizable: `<ResizablePanelGroup direction="horizontal"><ResizablePanel>歌词</ResizablePanel><ResizableHandle /><ResizablePanel>队列</ResizablePanel></ResizablePanelGroup>`,
  "scroll-area": `<ScrollArea className="h-48 w-full max-w-sm rounded-md border p-4">
  <div>夜曲 · 周杰伦</div>
  <div>晴天 · 周杰伦</div>
  <div>一路向北 · 周杰伦</div>
</ScrollArea>`,
  select: `<Select><SelectTrigger><SelectValue placeholder="选择歌单" /></SelectTrigger><SelectContent><SelectItem value="daily">每日推荐</SelectItem></SelectContent></Select>`,
  separator: `<div><span>歌曲</span><Separator className="my-3" /><span>专辑</span></div>`,
  sheet: `<Sheet><SheetTrigger asChild><Button variant="outline">打开设置</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>播放设置</SheetTitle></SheetHeader></SheetContent></Sheet>`,
  sidebar: `<SidebarProvider><Sidebar><SidebarHeader>Scopify</SidebarHeader><SidebarContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton>发现音乐</SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarContent></Sidebar><main>内容</main></SidebarProvider>`,
  skeleton: `<div className="space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>`,
  slider: `<Slider defaultValue={[42]} max={100} step={1} aria-label="音量" />`,
  sonner: `<Button onClick={() => toast.success("已添加到播放队列")}>添加到队列</Button>`,
  spinner: `<div className="flex items-center gap-2"><Spinner /><span>正在加载</span></div>`,
  switch: `<div className="flex items-center gap-3"><Switch id="crossfade" /><Label htmlFor="crossfade">歌曲淡入淡出</Label></div>`,
  table: `<Table>
  <TableHeader>
    <TableRow><TableHead>歌曲</TableHead><TableHead>艺人</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>夜曲</TableCell><TableCell>周杰伦</TableCell></TableRow>
  </TableBody>
</Table>`,
  tabs: `<Tabs defaultValue="songs">
  <TabsList>
    <TabsTrigger value="songs">歌曲</TabsTrigger>
    <TabsTrigger value="albums">专辑</TabsTrigger>
  </TabsList>
  <TabsContent value="songs">歌曲列表</TabsContent>
</Tabs>`,
  textarea: `<Textarea placeholder="写下你的评论" />`,
  "toggle-group": `<ToggleGroup type="single" defaultValue="playlist">
  <ToggleGroupItem value="playlist" aria-label="歌单视图"><ListMusic /></ToggleGroupItem>
  <ToggleGroupItem value="lyrics" aria-label="歌词视图"><Mic2 /></ToggleGroupItem>
</ToggleGroup>`,
  toggle: `<Toggle aria-label="切换粗体" variant="outline"><Bold />粗体</Toggle>`,
  tooltip: `<Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" aria-label="更多"><MoreHorizontal /></Button></TooltipTrigger><TooltipContent>更多操作</TooltipContent></Tooltip>`,
};

export function ShadcnComponentExample({ name }: ShadcnComponentExampleProps) {
  const slug = name.replace(/^shadcn-/, "") as ShadcnComponentSlug;
  const code = codeByName[slug] ?? `<${slug} />`;
  return (
    <ShadcnExample code={code} name={name}>
      <ShadcnPreview name={name} />
    </ShadcnExample>
  );
}
