# Task 1: Add i18n translation key

## Requirements

Add the `contextMenu.goToArtist` translation key in all three language sections of `lib/i18n.ts`.

### Exact Changes

1. **Chinese (Simplified)** — after `"contextMenu.recommendLess": "减少推荐",`:
   ```
   "contextMenu.goToArtist": "查看歌手",
   ```

2. **Chinese (Traditional)** — after `"contextMenu.recommendLess": "減少推薦",`:
   ```
   "contextMenu.goToArtist": "查看歌手",
   ```

3. **English** — after `"contextMenu.recommendLess": "Recommend less",`:
   ```
   "contextMenu.goToArtist": "View Artist",
   ```

### Files
- Modify: `lib/i18n.ts`

### Commit
```bash
git add lib/i18n.ts
git commit -m "feat(i18n): add contextMenu.goToArtist translation key"
```

### Verification
- Verify all three keys exist after running `grep "contextMenu.goToArtist" lib/i18n.ts`
- Build should not break
