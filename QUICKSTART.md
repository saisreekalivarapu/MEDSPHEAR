# 🚀 Quick Start Guide - MediQueue AI

## For First-Time Setup (5 Minutes)

### Step 1: Export from Figma Make ⬇️
1. In Figma Make, click the **"..."** menu (top right)
2. Select **"Export Project"** or **"Download Code"**
3. Save the ZIP file to your computer
4. Extract it to a folder (e.g., `Desktop/mediqueue-ai`)

### Step 2: Open in VS Code 💻
```bash
# Open Terminal/Command Prompt
# Navigate to the folder
cd Desktop/mediqueue-ai

# Open VS Code
code .
```

### Step 3: Install Dependencies 📦
In VS Code Terminal (View → Terminal):
```bash
# Check if Node.js is installed
node -v

# If not installed, download from: https://nodejs.org

# Install project dependencies
npm install
```

This will take 2-3 minutes...

### Step 4: Run the App 🏃
```bash
npm run dev
```

Your browser will open to: **http://localhost:5173**

---

## 🎥 Demo Flow (What to Show)

### Demo 1: Patient Registration (2 minutes)
1. Open home page
2. Fill form:
   - Name: "John Doe"
   - Age: 45
   - Symptoms: "chest pain and shortness of breath"
   - Type: Emergency
3. Click "Register"
4. **Show**: AI detected "CRITICAL" urgency ⚠️
5. **Show**: Patient is #1 in queue with priority

### Demo 2: Another Patient (Normal Priority)
1. Register another patient:
   - Name: "Jane Smith"
   - Age: 28
   - Symptoms: "mild fever and cough"
   - Type: OPD
2. **Show**: AI detected "NORMAL" urgency ✅
3. **Show**: Patient is #2 (John is still #1 due to critical priority)

### Demo 3: View Live Queue 📊
1. Click "View Queue" button
2. **Show**:
   - Real-time queue positions
   - Expected wait times
   - Priority scores
   - Auto-refresh indicator

### Demo 4: Admin Dashboard 👨‍⚕️
1. Click "Staff Login"
2. Enter:
   - Username: `admin`
   - Password: `admin123`
3. **Show**:
   - Live statistics (2 waiting, 1 critical)
   - Current queue with patient details
   - Doctor availability (4 doctors online)

### Demo 5: Start Consultation 🩺
1. In admin dashboard, click "Start Consultation" for John
2. **Show**:
   - Patient moves to "In Consultation"
   - Doctor status changes to "Busy"
   - Queue automatically reorders

### Demo 6: Complete Consultation ✅
1. Click "Complete Consultation"
2. **Show**:
   - Patient moves to "History" tab
   - Doctor becomes available again
   - Next patient moves up in queue

---

## 🎯 Key Features to Highlight

### ✨ AI Features
- ✅ **Symptom Analysis**: Detects critical keywords
- ✅ **Smart Prioritization**: Critical patients go first
- ✅ **Wait Time Prediction**: Accurate estimates
- ✅ **Auto Queue Optimization**: Real-time reordering

### 📱 User Experience
- ✅ **Simple Registration**: 4 fields, done in 1 minute
- ✅ **Real-time Updates**: See your position live
- ✅ **Toast Notifications**: Instant feedback
- ✅ **Responsive Design**: Works on phone & desktop

### 👨‍💼 Admin Features
- ✅ **Complete Dashboard**: See everything at once
- ✅ **Doctor Management**: Control availability
- ✅ **Consultation Tracking**: Start/complete consultations
- ✅ **Performance Metrics**: Stats & analytics

---

## 🐛 Troubleshooting

### Issue: `npm: command not found`
**Solution**: Install Node.js from https://nodejs.org

### Issue: Port 5173 already in use
**Solution**: 
```bash
# Kill the process or use different port
npm run dev -- --port 3000
```

### Issue: Blank screen or errors
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Data not showing
**Solution**: Clear browser localStorage (F12 → Application → Local Storage → Clear)

---

## 📤 Sharing Your Demo

### Option 1: Screen Share
Best for live presentations. Just run `npm run dev` and share screen.

### Option 2: Deploy Online (Free)
```bash
# Deploy to Vercel (takes 2 minutes)
npm i -g vercel
vercel
```
You'll get a live URL like: `mediqueue-ai.vercel.app`

### Option 3: Record Video
1. Run the app locally
2. Use OBS Studio or Screen Recorder
3. Follow the demo flow above
4. Share video file

---

## 💡 Tips for Impressive Demo

1. **Test First**: Run through the entire flow before presenting
2. **Prepare Data**: Register 3-4 patients beforehand
3. **Show AI in Action**: Emphasize how symptoms affect priority
4. **Highlight Real-time**: Refresh the queue page to show live updates
5. **Admin Power**: Show how staff can manage everything from one place

---

## 📞 Need Help?

- **Check README.md** - Full documentation
- **Review Code Comments** - Each file has detailed comments
- **Test Credentials**: admin/admin123
- **Clear Data**: Use "Clear Data" button in admin dashboard

---

## ✅ Checklist Before Presenting

- [ ] Node.js installed
- [ ] Project running on localhost
- [ ] Test patient registration works
- [ ] Test admin login works
- [ ] Prepared demo script
- [ ] Browser tabs ready
- [ ] Data cleared (fresh start)

---

**You're all set! 🎉 The app is running and ready to impress!**
