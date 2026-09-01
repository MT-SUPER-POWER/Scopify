# Listening report design QA

- Source reference: `docs/design/listening-report-long-design.png`
- Route checked: `/recent/report`
- Data path checked: `/listen/data/report` → `useListeningReportQuery` → `ListeningReportView`
- Viewport checked: 724 × 900 CSS pixels, matching the reference width.

## Checks

- The route renders as a normal page inside the existing application shell; it does not replace the global rail, header, or player.
- The hero, repeated-listening panel, rhythm chart/attendance, artist rows, taste meters, collage archive, period controls, and poster entry were checked with the real report response.
- The displayed 121 小时 47 分钟, 31/31 attendance, artwork URLs, song ranking, peak day, and taste values come from business data rather than local demo constants.
- A fresh browser tab reported no runtime errors after the final reload.
- No P0, P1, or P2 visual issues found.

final result: passed
