@echo off
echo =======================================================
echo Pushing AiFeedback to branch Ai-Orchestration on Github_Papers...
echo =======================================================

git init
git add .
git commit -m "feat: implement multi-agent AI feedback loop with Gemini support and interactive UI"
git branch -M Ai-Orchestration
git remote remove origin 2>nul
git remote add origin https://github.com/samipatel12345678/Github_Papers.git
git push -u origin Ai-Orchestration

echo.
echo =======================================================
echo Push completed!
echo =======================================================
pause
