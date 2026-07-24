import React, { useCallback, useState } from "react";
import { Globe, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { TranslateFn } from "@/types/i18n.generated";
import type { Theme, UrlBackgroundItem } from "../../../../types";
import { colorWithAlpha } from "../../colorMix";
import { normalizeUrlBackgroundUrl } from "../../../../utils/urlBackground";

// src/components/visualizer/backgrounds/url/UrlBackgroundSettingsCard.tsx
// Settings card for managing URL background list (add/edit/delete/select).

interface UrlBackgroundSettingsCardProps {
  t: TranslateFn;
  isDaylight: boolean;
  theme: Theme;
  controlCardBg: string;
  urlBackgroundList?: UrlBackgroundItem[];
  urlBackgroundSelectedId?: string | null;
  onAddUrlBackgroundItem?: (item: UrlBackgroundItem) => void;
  onUpdateUrlBackgroundItem?: (id: string, patch: Partial<Omit<UrlBackgroundItem, "id">>) => void;
  onDeleteUrlBackgroundItem?: (id: string) => void;
  onSetUrlBackgroundSelectedId?: (id: string | null) => void;
}

const generateId = () => `url-bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const UrlBackgroundSettingsCard: React.FC<UrlBackgroundSettingsCardProps> = ({
  t,
  isDaylight,
  theme,
  controlCardBg,
  urlBackgroundList = [],
  urlBackgroundSelectedId = null,
  onAddUrlBackgroundItem,
  onUpdateUrlBackgroundItem,
  onDeleteUrlBackgroundItem,
  onSetUrlBackgroundSelectedId,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [draftNote, setDraftNote] = useState("");

  const resetDraft = useCallback(() => {
    setDraftUrl("");
    setDraftNote("");
    setIsAdding(false);
    setEditingId(null);
  }, []);

  const handleAdd = useCallback(() => {
    const trimmedUrl = normalizeUrlBackgroundUrl(draftUrl);
    if (!trimmedUrl) return;
    const item: UrlBackgroundItem = {
      id: generateId(),
      url: trimmedUrl,
      note: draftNote.trim() || trimmedUrl,
    };
    onAddUrlBackgroundItem?.(item);
    onSetUrlBackgroundSelectedId?.(item.id);
    resetDraft();
  }, [draftUrl, draftNote, onAddUrlBackgroundItem, onSetUrlBackgroundSelectedId, resetDraft]);

  const handleStartEdit = useCallback((item: UrlBackgroundItem) => {
    setEditingId(item.id);
    setDraftUrl(item.url);
    setDraftNote(item.note);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;
    const trimmedUrl = normalizeUrlBackgroundUrl(draftUrl);
    if (!trimmedUrl) return;
    onUpdateUrlBackgroundItem?.(editingId, {
      url: trimmedUrl,
      note: draftNote.trim() || trimmedUrl,
    });
    resetDraft();
  }, [editingId, draftUrl, draftNote, onUpdateUrlBackgroundItem, resetDraft]);

  const handleDelete = useCallback(
    (id: string) => {
      onDeleteUrlBackgroundItem?.(id);
    },
    [onDeleteUrlBackgroundItem],
  );

  const handleSelect = useCallback(
    (id: string) => {
      onSetUrlBackgroundSelectedId?.(id);
    },
    [onSetUrlBackgroundSelectedId],
  );

  const isEditingOrAdding = isAdding || editingId !== null;
  const borderColor = colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.16);
  const itemBg = colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34);
  const inputBg = colorWithAlpha(theme.backgroundColor, isDaylight ? 0.42 : 0.52);

  return (
    <div
      className="space-y-4 rounded-[24px] border p-4"
      style={{ backgroundColor: controlCardBg, borderColor }}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
          {t("folia.options.urlBackgroundSettings")}
        </div>
        <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
          {t("folia.options.urlBackgroundSettingsDesc")}
        </div>
      </div>

      {/* URL list */}
      {urlBackgroundList.length > 0 && (
        <div className="space-y-2">
          {urlBackgroundList.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border p-3 transition-all"
              style={{
                borderColor: item.id === urlBackgroundSelectedId ? theme.accentColor : borderColor,
                backgroundColor:
                  item.id === urlBackgroundSelectedId
                    ? colorWithAlpha(theme.accentColor, isDaylight ? 0.1 : 0.16)
                    : itemBg,
              }}
            >
              {editingId === item.id ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={draftUrl}
                    onChange={(e) => setDraftUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: inputBg,
                      borderColor,
                      color: theme.primaryColor,
                    }}
                  />
                  <input
                    type="text"
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder={t("folia.options.urlBackgroundNotePlaceholder")}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: inputBg,
                      borderColor,
                      color: theme.primaryColor,
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-white/10"
                      style={{ borderColor, color: theme.secondaryColor }}
                    >
                      <X size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!draftUrl.trim()}
                      className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-white/10 disabled:opacity-40"
                      style={{ borderColor: theme.accentColor, color: theme.accentColor }}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div
                      className="truncate text-sm font-medium"
                      style={{ color: theme.primaryColor }}
                    >
                      {item.note}
                    </div>
                    <div
                      className="mt-0.5 truncate text-xs opacity-60"
                      style={{ color: theme.secondaryColor }}
                    >
                      {item.url}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="flex size-7 items-center justify-center rounded-full border transition-colors hover:bg-white/10"
                      style={{ borderColor, color: theme.secondaryColor }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="flex size-7 items-center justify-center rounded-full border transition-colors hover:bg-red-500/10"
                      style={{ borderColor, color: theme.secondaryColor }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new URL form */}
      {isAdding ? (
        <div
          className="space-y-2 rounded-2xl border p-3"
          style={{ borderColor, backgroundColor: itemBg }}
        >
          <input
            type="url"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: inputBg,
              borderColor,
              color: theme.primaryColor,
            }}
          />
          <input
            type="text"
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder={t("folia.options.urlBackgroundNotePlaceholder")}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: inputBg,
              borderColor,
              color: theme.primaryColor,
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetDraft}
              className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-white/10"
              style={{ borderColor, color: theme.secondaryColor }}
            >
              <X size={14} />
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draftUrl.trim()}
              className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-white/10 disabled:opacity-40"
              style={{ borderColor: theme.accentColor, color: theme.accentColor }}
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraftUrl("");
            setDraftNote("");
            setIsAdding(true);
          }}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors hover:bg-white/5"
          style={{ borderColor, color: theme.primaryColor }}
        >
          <Plus size={16} />
          {t("folia.options.urlBackgroundAdd")}
        </button>
      )}

      {urlBackgroundList.length === 0 && !isAdding && (
        <div className="flex flex-col items-center gap-2 py-3 opacity-50">
          <Globe size={24} style={{ color: theme.secondaryColor }} />
          <div className="text-xs" style={{ color: theme.secondaryColor }}>
            {t("folia.options.urlBackgroundEmpty")}
          </div>
        </div>
      )}
    </div>
  );
};

export { UrlBackgroundSettingsCard };
