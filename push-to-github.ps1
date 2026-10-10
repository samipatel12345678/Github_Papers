Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Pushing to GitHub (Branch: Ai-Orchestration)..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

git init
git add .
git commit -m "feat: implement multi-agent AI feedback loop with Gemini support and interactive UI"
git branch -M Ai-Orchestration
try { git remote remove origin } catch {}
git remote add origin https://github.com/samipatel12345678/Github_Papers.git
git push -u origin Ai-Orchestration

Write-Host "`nPush finished successfully!" -ForegroundColor Green
