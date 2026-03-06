# 📋 File Download Checklist

Copy each file from Figma Make to your Desktop following this structure:

## ✅ Step-by-Step Download Instructions

### 1. Create Main Folder
Location: Desktop
Name: mediqueue-ai

### 2. Root Level Files (save to Desktop/mediqueue-ai/)
- [ ] package.json
- [ ] README.md
- [ ] QUICKSTART.md
- [ ] DEPLOYMENT.md
- [ ] vite.config.ts
- [ ] postcss.config.mjs
- [ ] tsconfig.json (if exists)

### 3. Source Code Files

#### src/app/ (save to Desktop/mediqueue-ai/src/app/)
- [ ] App.tsx
- [ ] routes.ts

#### src/app/pages/ (save to Desktop/mediqueue-ai/src/app/pages/)
- [ ] Root.tsx
- [ ] PatientPortal.tsx
- [ ] QueueDashboard.tsx
- [ ] AdminDashboard.tsx
- [ ] StaffLogin.tsx

#### src/app/types/ (save to Desktop/mediqueue-ai/src/app/types/)
- [ ] index.ts

#### src/app/utils/ (save to Desktop/mediqueue-ai/src/app/utils/)
- [ ] aiEngine.ts
- [ ] storage.ts

#### src/app/components/ui/ (save to Desktop/mediqueue-ai/src/app/components/ui/)
Copy ALL files from this folder (40+ files)
- [ ] accordion.tsx
- [ ] alert-dialog.tsx
- [ ] alert.tsx
- [ ] aspect-ratio.tsx
- [ ] avatar.tsx
- [ ] badge.tsx
- [ ] breadcrumb.tsx
- [ ] button.tsx
- [ ] calendar.tsx
- [ ] card.tsx
- [ ] carousel.tsx
- [ ] chart.tsx
- [ ] checkbox.tsx
- [ ] collapsible.tsx
- [ ] command.tsx
- [ ] context-menu.tsx
- [ ] dialog.tsx
- [ ] drawer.tsx
- [ ] dropdown-menu.tsx
- [ ] form.tsx
- [ ] hover-card.tsx
- [ ] input-otp.tsx
- [ ] input.tsx
- [ ] label.tsx
- [ ] menubar.tsx
- [ ] navigation-menu.tsx
- [ ] pagination.tsx
- [ ] popover.tsx
- [ ] progress.tsx
- [ ] radio-group.tsx
- [ ] resizable.tsx
- [ ] scroll-area.tsx
- [ ] select.tsx
- [ ] separator.tsx
- [ ] sheet.tsx
- [ ] sidebar.tsx
- [ ] skeleton.tsx
- [ ] slider.tsx
- [ ] sonner.tsx
- [ ] switch.tsx
- [ ] table.tsx
- [ ] tabs.tsx
- [ ] textarea.tsx
- [ ] toggle-group.tsx
- [ ] toggle.tsx
- [ ] tooltip.tsx
- [ ] use-mobile.ts
- [ ] utils.ts

#### src/app/components/figma/ (save to Desktop/mediqueue-ai/src/app/components/figma/)
- [ ] ImageWithFallback.tsx

#### src/styles/ (save to Desktop/mediqueue-ai/src/styles/)
- [ ] index.css
- [ ] tailwind.css
- [ ] theme.css
- [ ] fonts.css

## 📝 How to Copy Each File:

1. In Figma Make, click the file in left sidebar
2. Press Ctrl+A (or Cmd+A on Mac) - select all code
3. Press Ctrl+C (or Cmd+C on Mac) - copy
4. Open Notepad (Windows) or TextEdit (Mac)
5. Press Ctrl+V (or Cmd+V on Mac) - paste
6. Save with exact filename to correct folder

## ⚠️ Important Notes:

- Keep exact file names (case-sensitive!)
- Keep exact folder structure
- Don't skip any files
- .tsx and .ts files are text files (save as plain text)
- package.json is most important - don't skip it!

## ✅ After All Files Downloaded:

Open Terminal/Command Prompt:
```bash
cd Desktop/mediqueue-ai
npm install
npm run dev
```

Your app will run at: http://localhost:5173
