# github-news-retention maintenance automation

Run from `C:\Users\Admin\Documents\GitHub\LuisVMiranda.github.io\news` every day at 08:30 GMT-3 (`America/Sao_Paulo`), after the 07:45 publication job.

This is an unattended retention worker. Never ask the user questions. The retention window is three 24-hour days. Protect all article files referenced by retained active editions so cleanup never creates broken routes. Remove older editions, older unreferenced article JSON files, and local ignored research/build artifacts older than the cutoff. Do not delete credentials, unknown files, current manifests, or any article still referenced by a retained edition.

Run:

```text
npm run news:cleanup -- --days 3 --apply
npm run news:verify
npm run check
npm run lint
npm run format:check
npm test -- --run
npm run build:preview
npm run package:pages
npx tsx scripts/check-reviews.ts
npm run review
```

If the cleanup changes tracked content, record machine approval for the exact new `npm run review` digest as `github-news retention worker`, commit only the intended retention changes, and push `main`. Verify the remote SHA, GitHub Actions validation, Pages deployment, and the live homepage plus section routes. If the worktree is dirty with unknown changes, or validation/release/deployment fails, stop without deleting unknown files or pushing. The worker may retry safe validation paths but must never force-push or rewrite history.

The cleanup script is intentionally conservative: current edition references are protected even when a source date is older than the retention cutoff. The next daily news refresh must replace those protected references with fresh stories before they age out of the active edition.
