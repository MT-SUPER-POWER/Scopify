export interface CollectionToggleButtonProps {
  isCollected: boolean;
  isLoading: boolean;
  onToggle: () => void;
  subscribeLabel: string;
  unsubscribeLabel: string;
}
