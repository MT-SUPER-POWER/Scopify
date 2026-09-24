export interface AudioSettingsDialogProps {
  children: React.ReactNode;
}

export interface AudioSettingsTabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick(): void;
}
