// Releases renderer-owned data without discarding display trees that must remain seekable.
export interface PixiDisplayNode {
  children?: PixiDisplayNode[];
  visible?: boolean;
  /** A Graphics' GraphicsContext: large (unbatched) contexts own a batcher and vertex/index buffers. */
  context?: { unload?: () => void };
  unload?: () => void;
  destroy?: () => void;
}

export const unloadPixiDisplayTree = (root: PixiDisplayNode) => {
  const stack = [...(root.children ?? [])];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.children?.length) stack.push(...node.children);
    // Graphics.unload() only frees the view's batch data; the buffers hang off its context
    // (Folia 66119721). Pixi rebuilds and re-uploads them if the node is drawn again.
    node.context?.unload?.();
    node.unload?.();
  }
};

/** Unloads descendants exactly once when a retained Pixi tree leaves the visible set. */
export const setPixiDisplayTreeVisibility = (root: PixiDisplayNode, visible: boolean) => {
  const wasVisible = root.visible !== false;
  root.visible = visible;
  if (wasVisible && !visible) unloadPixiDisplayTree(root);
};

/**
 * Destroys a whole display tree, including each Graphics' self-owned GraphicsContext, while
 * leaving shared contexts passed in at construction alone (Folia 66119721).
 * `destroy({ children: true })` cannot do this: Container forwards the options object to every
 * child, and Pixi 8's Graphics keeps its own context whenever it receives options without
 * `context: true`, so its GPU data waits for Pixi's 60-second idle GC. Only an argument-less
 * `destroy()` releases exactly the self-owned context; for every other node it matches
 * `{ children: true }` and leaves textures untouched.
 */
export const destroyPixiDisplayTree = (root: PixiDisplayNode) => {
  // Pre-order collection destroyed in reverse: children always go before their parent.
  const order: PixiDisplayNode[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    order.push(node);
    if (node.children?.length) stack.push(...node.children);
  }
  for (let index = order.length - 1; index >= 0; index -= 1) order[index]!.destroy?.();
};

// removeChildren() only detaches nodes; explicitly destroy detached subtrees.
export const destroyPixiContainerChildren = (
  container: PixiDisplayNode & { removeChildren: () => PixiDisplayNode[] },
) => {
  container.removeChildren().forEach(destroyPixiDisplayTree);
};
