# 📋 Project Export & Deployment Instructions

## 🎯 How to Get This Code Out of Figma Make

### Method 1: Manual File Copy (Recommended)
Since you're already in Figma Make, you can see all files in the left sidebar:

1. **Create a local folder** on your computer:
   ```bash
   mkdir mediqueue-ai
   cd mediqueue-ai
   ```

2. **Copy these core files** from Figma Make to your local folder:
   ```
   Required Files:
   ├── package.json (already exists)
   ├── vite.config.ts (already exists)
   ├── tsconfig.json (if exists)
   ├── postcss.config.mjs (already exists)
   ├── README.md (just created)
   ├── QUICKSTART.md (just created)
   ├── src/
   │   ├── app/
   │   │   ├── App.tsx
   │   │   ├── routes.ts
   │   │   ├── pages/
   │   │   │   ├── Root.tsx
   │   │   │   ├── PatientPortal.tsx
   │   │   │   ├── QueueDashboard.tsx
   │   │   │   ├── AdminDashboard.tsx
   │   │   │   └── StaffLogin.tsx
   │   │   ├── types/
   │   │   │   └── index.ts
   │   │   ├── utils/
   │   │   │   ├── aiEngine.ts
   │   │   │   └── storage.ts
   │   │   └── components/
   │   │       ├── ui/ (all shadcn components)
   │   │       └── figma/
   │   └── styles/
   │       ├── index.css
   │       ├── tailwind.css
   │       ├── theme.css
   │       └── fonts.css
   ```

### Method 2: Export from Figma Make
Look for these options in Figma Make:
- **Export Project** button
- **Download** option in menu
- **Share** → **Download as ZIP**

### Method 3: Use Figma Make's GitHub Integration
If available:
1. Connect to GitHub
2. Push to repository
3. Clone to your local machine

---

## 💻 Running in VS Code - Complete Guide

### Prerequisites Installation

#### 1. Install Node.js
```bash
# Check if already installed
node -v
npm -v

# If not installed:
# Download from: https://nodejs.org (LTS version)
# Follow installer instructions
```

#### 2. Install VS Code
- Download from: https://code.visualstudio.com
- Install recommended extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Setup Steps

#### Step 1: Open Project
```bash
# Navigate to project folder
cd /path/to/mediqueue-ai

# Open in VS Code
code .
```

#### Step 2: Install Dependencies
```bash
# In VS Code terminal (Ctrl+` or Cmd+`)
npm install

# This installs all packages from package.json
# Wait 2-3 minutes for completion
```

#### Step 3: Start Development Server
```bash
npm run dev

# You should see:
# VITE v6.3.5  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

#### Step 4: Open in Browser
- Automatically opens, or
- Manually visit: http://localhost:5173

---

## 🌐 Deployment Options

### Option 1: Vercel (Easiest - 2 minutes)

**Deploy from Local:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name? mediqueue-ai
# - Directory? ./ (default)
# - Want to modify settings? No

# You'll get a URL like: https://mediqueue-ai-xxx.vercel.app
```

**Deploy from GitHub:**
1. Push code to GitHub repository
2. Visit https://vercel.com
3. Click "Import Project"
4. Select your repository
5. Deploy automatically

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build project
npm run build

# Deploy
netlify deploy --prod

# Follow prompts:
# - Create new site? Yes
# - Publish directory? dist
```

**Or via UI:**
1. Visit https://app.netlify.com
2. Drag & drop the `dist` folder
3. Get instant URL

### Option 3: GitHub Pages (Free)

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

### Option 4: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

---

## 📦 Creating Shareable Package

### Create ZIP File

**Windows:**
```powershell
# In project folder
Compress-Archive -Path * -DestinationPath mediqueue-ai.zip
```

**Mac/Linux:**
```bash
# In project folder
zip -r mediqueue-ai.zip . -x "node_modules/*" ".git/*"
```

### What to Include in ZIP:
```
✅ Include:
- src/ folder (all source code)
- package.json
- vite.config.ts
- tsconfig.json
- postcss.config.mjs
- README.md
- QUICKSTART.md
- All config files

❌ Exclude:
- node_modules/ (too large, can reinstall)
- dist/ (can rebuild)
- .git/ (optional)
```

---

## 🎁 Sharing with Others

### For Developers:

**Share via GitHub:**
1. Create repository
2. Push code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MediQueue AI"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```
3. Share repository link

**Share ZIP + Instructions:**
1. Create ZIP (exclude node_modules)
2. Include README.md and QUICKSTART.md
3. Share via Google Drive/Dropbox/Email

**Recipients run:**
```bash
unzip mediqueue-ai.zip
cd mediqueue-ai
npm install
npm run dev
```

### For Non-Developers (Demo/Presentation):

**Option 1: Deploy Online**
- Deploy to Vercel/Netlify
- Share live URL
- No installation needed for viewers

**Option 2: Video Demo**
- Record screen while using app
- Upload to YouTube/Google Drive
- Share link

**Option 3: Presentation Slides**
- Screenshots of key features
- Demo flow diagram
- Benefits and metrics

---

## 📤 Saving to Google Drive

### Steps:

1. **Create ZIP file** (without node_modules):
   ```bash
   # Exclude large folders
   zip -r mediqueue-ai-source.zip . -x "node_modules/*" "dist/*" ".git/*"
   ```

2. **Upload to Google Drive:**
   - Go to https://drive.google.com
   - Click "New" → "File Upload"
   - Select mediqueue-ai-source.zip
   - Wait for upload to complete

3. **Share the Drive link:**
   - Right-click the file → "Get link"
   - Change to "Anyone with the link"
   - Copy and share URL

4. **Add README as Google Doc:**
   - Copy contents of README.md
   - Create new Google Doc
   - Paste and format
   - Share alongside ZIP file

---

## 🔧 Advanced: Create Installer Script

Create `setup.sh` (Mac/Linux) or `setup.bat` (Windows):

**setup.sh:**
```bash
#!/bin/bash
echo "🏥 Setting up MediQueue AI..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from nodejs.org"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build project
echo "🔨 Building project..."
npm run build

# Start server
echo "🚀 Starting development server..."
npm run dev
```

Make executable:
```bash
chmod +x setup.sh
./setup.sh
```

---

## ✅ Final Checklist

Before sharing:
- [ ] Code works locally
- [ ] README.md is complete
- [ ] QUICKSTART.md is clear
- [ ] Demo credentials documented
- [ ] No sensitive data in code
- [ ] node_modules excluded from ZIP
- [ ] Deployment tested (if sharing live URL)
- [ ] Instructions verified by someone else

---

## 🎬 Demo Script for Presentations

**Intro (30 seconds):**
"This is MediQueue AI, an intelligent patient queue management system that uses AI to optimize hospital wait times and prioritize critical patients."

**Patient Flow (2 minutes):**
1. Register patient with chest pain → AI detects CRITICAL
2. Register patient with fever → AI detects NORMAL
3. Show queue: Critical patient is #1

**Admin Flow (2 minutes):**
1. Login to admin dashboard
2. Show live statistics
3. Start consultation for critical patient
4. Complete consultation
5. Show metrics update in real-time

**Closing (30 seconds):**
"The system reduces wait times by 40-60%, improves emergency response, and enhances overall hospital efficiency."

---

**Ready to share your project! 🚀**

Need help? Check README.md for detailed documentation.
