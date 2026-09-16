"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { thumbnailModifiers, useSortableListDrag } from "@/hooks/playlist/useSortableListDrag";
import { SortableListContext } from "@/lib/playlist/sortableListContext";
import { useI18n } from "@/store/module/i18n";
import type { SortableListProps } from "@/types/sortableList";
import "./trackDrag.css";

export function SortableList(props: SortableListProps) {
  const { t } = useI18n();
  const drag = useSortableListDrag({ ...props, disabled: props.disabled || props.busy });
  return (
    <DndContext
      sensors={drag.sensors}
      collisionDetection={drag.collisionDetection}
      onDragStart={drag.onDragStart}
      onDragMove={drag.syncInsertion}
      onDragOver={drag.syncInsertion}
      onDragEnd={drag.onDragEnd}
      onDragCancel={drag.clear}
      accessibility={{
        restoreFocus: false,
        screenReaderInstructions: { draggable: t("queue.keyboardHint") },
      }}
    >
      <SortableContext items={props.ids} strategy={() => null}>
        <SortableListContext.Provider
          value={{
            reorderDisabled: Boolean(props.reorderDisabled),
            available: !props.disabled,
            disabled: Boolean(props.disabled || props.busy),
            activeId: drag.activeId,
            insertion: drag.insertion,
            keyboardDrag: drag.keyboardDrag,
            landingId: drag.landingId,
            landingVersion: drag.landingVersion,
            consumeLanding: drag.consumeLanding,
          }}
        >
          {props.children}
        </SortableListContext.Provider>
      </SortableContext>
      {typeof document !== "undefined" &&
        createPortal(
          <DragOverlay
            zIndex={2100}
            dropAnimation={null}
            modifiers={thumbnailModifiers}
            style={{ pointerEvents: "none", width: 200, height: 44 }}
          >
            {drag.activeId !== null && (
              <div inert aria-hidden="true" className="relative text-content">
                {props.renderOverlay(drag.activeId)}
              </div>
            )}
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  );
}
