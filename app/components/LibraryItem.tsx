interface LibraryItemProps {
  id: string | number;
  title: string;
  subtitle: string;
  coverImg: string;
}

export const LibraryItem = ({
  title,
  subtitle,
  coverImg,
}: LibraryItemProps) => {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors group">
      <div className="w-12 h-12 rounded-md shrink-0 overflow-hidden">
        <img
          src={coverImg}
          alt={title}
          className="w-full h-full object-cover rounded-md"
        />
      </div>
      <div className="flex flex-col overflow-hidden flex-1">
        <span className="text-white truncate text-base font-normal group-hover:text-white">
          {title}
        </span>
        <span className="text-zinc-400 text-sm truncate mt-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );
};
