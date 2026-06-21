export interface PlaylistTagSelectorProps {
  value: string[];
  maxSelected: number;
  onChange: (tags: string[]) => void;
}
