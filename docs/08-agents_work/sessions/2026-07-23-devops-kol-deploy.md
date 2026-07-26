---
agent: devops-engineer
task: kol-deploy
date: 2026-07-23
linear_ticket: Wave-3 Track C
qa_verdict: N/A (deploy-only, no source change)
status: COMPLETE
---

Deployed apps/kol to Vercel preview as project `kol-demo`.
Source: origin/main @ f7e69df (detached worktree — no application source modified).
32 SSG pages build clean locally and on Vercel. 10/10 smoke routes 200.
Preview URL: https://kol-demo.vercel.app
Promote to prod: `cd .worktrees/kol-deploy/apps/kol && vercel --prod`
