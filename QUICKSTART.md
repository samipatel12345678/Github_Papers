# 🚀 QUICK START - 15 MINUTES OR LESS

## Copy & Paste These 6 Commands

```bash
cd C:\Users\Dell\OneDrive\Desktop\AiFeedback
node create-all-files.js
npm install
cp .env.example .env
# EDIT .env and add ANTHROPIC_API_KEY from https://console.anthropic.com
npm run dev
```

---

## What Happens After Each Command

### Command 1: Navigate
```bash
cd C:\Users\Dell\OneDrive\Desktop\AiFeedback
```
**Does**: Opens your project folder

---

### Command 2: Generate Files
```bash
node create-all-files.js
```
**Does**: Creates src/ folder and 6 source files
**Wait**: ~1 second
**Look for**: ✓ Created successfully message

---

### Command 3: Install Dependencies  
```bash
npm install
```
**Does**: Installs all npm packages
**Wait**: 2-3 minutes (you can work on next step while waiting)
**Look for**: "up to date" message at end

---

### Command 4: Copy Config
```bash
cp .env.example .env
```
**Does**: Creates .env file from template
**Wait**: Instant
**Look for**: .env file now exists in project root

---

### Command 5: Add API Key
```
# Open .env in text editor
# Find: ANTHROPIC_API_KEY=your-key-here
# Replace with: ANTHROPIC_API_KEY=sk-ant-v0-YOUR_ACTUAL_KEY
# Save file
```

**How to get key**:
1. Go to: https://console.anthropic.com
2. Sign up or login
3. Create API key
4. Copy it
5. Paste into .env file

**Important**: Keep this key secret! Never share!

---

### Command 6: Start Server
```bash
npm run dev
```
**Does**: Starts both frontend and backend
**Wait**: 10 seconds
**Look for**: Both terminals show:
- Backend: "Server is running on http://localhost:5000"
- Frontend: "Local: http://localhost:5173"

---

## Step 7: Open Browser

1. Go to: **http://localhost:5173**
2. You should see: Purple header with "AI Feedback Loop System"
3. Enter topic (e.g., "Artificial Intelligence")
4. Click "Create Session"
5. Click "Next Step" repeatedly to watch AI work!

---

## Done! 🎉

Your AI Feedback Loop System is running!

**Total time**: 15 minutes (including npm install wait)

---

## If Something Goes Wrong

### Error: "Port already in use"
Edit `.env` and change `PORT=5000` to `PORT=5001`

### Error: "API key invalid"  
Get new key from https://console.anthropic.com

### Error: "Module not found"
Run `npm install` again

### Any other error
Read `SETUP_GUIDE.md` Troubleshooting section

---

## Next: Copy 4 More Files (5 minutes)

**WHILE** npm is installing OR after everything starts:

Copy these 4 files from guides into src/ folder:

From **IMPLEMENTATION_GUIDE.md**:
- FILE 6 → `src/FeedbackLoopOrchestrator.ts`
- FILE 7 → `src/server.ts`

From **FRONTEND_GUIDE.md**:
- FILE 8 → `src/App.tsx`  
- FILE 9 → `src/main.tsx`

---

## That's It!

You now have a working AI feedback loop system!

**Enjoy! 🚀**

---

*Want more details?* → Read `START_HERE.md`
*Want to understand?* → Read `GETTING_STARTED.md`
*Want everything?* → Read `CHECKLIST.md`
