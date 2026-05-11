# Mobile App Testing Guide for ParkNex-AI

## Issue Resolution: Expo Go Push Notifications Error (SDK 53)

### What Was the Problem?
- **Error**: "Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53"
- **Cause**: Expo Go no longer supports remote push notifications in SDK 53+. You need a development build instead.
- **Your App Version**: SDK 55 (Expo ~55.0.0)

### What Was Fixed?
✅ Added detection for Expo Go environment  
✅ Gracefully skip push notification setup when running in Expo Go  
✅ Added try-catch blocks to handle notification errors gracefully  
✅ App will still work, just without remote push notifications in Expo Go  

---

## How to Test Your Mobile App

### Option 1: Using Expo Go (Recommended for Quick Testing)
Use this for rapid development and debugging. **Note**: Remote push notifications will be skipped, but the app will run.

#### Setup:
1. Install Expo Go app on your phone from App Store or Google Play
2. In your project directory:
   ```bash
   cd mobile-app
   npm start
   ```
3. Scan the QR code with Expo Go
4. App will load without errors ✅

#### What to Check:
- ✅ Splash screen appears
- ✅ Onboarding screens load
- ✅ Navigation works
- ✅ Login/Authentication works
- ✅ Dashboard loads
- ✅ Parking zones display correctly
- ❌ Remote push notifications will NOT work (expected in Expo Go)

---

### Option 2: Using Development Build (Required for Push Notifications)
Use this when you need to test remote push notifications.

#### Prerequisites:
- EAS CLI installed: `npm install -g eas-cli`
- Expo account created
- Connected to EAS project (configured in `eas.json`)

#### Build Development Build:

**For Android:**
```bash
cd mobile-app
eas build --platform android --profile preview
# OR for local build (faster)
eas build --platform android --profile preview --local
```

**For iOS:**
```bash
cd mobile-app
eas build --platform ios --profile preview
# OR for local build
eas build --platform ios --profile preview --local
```

#### Install on Device:
- Follow instructions from EAS after build completes
- Install the resulting APK/IPA on your physical device
- Remote push notifications will now work! ✅

---

## Step-by-Step Testing Checklist

### 1. **Test with Expo Go (Fastest)**
```bash
cd mobile-app
npm start
```
- [ ] Scan QR with Expo Go
- [ ] No errors appear in console
- [ ] Splash screen displays
- [ ] Onboarding carousel works
- [ ] Can proceed to login

### 2. **Test Authentication**
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Can sign up as new user
- [ ] Session persists after closing app

### 3. **Test App Functionality**
- [ ] Can view available parking zones
- [ ] Can scan QR codes
- [ ] Dashboard data loads
- [ ] Tab navigation works
- [ ] Can switch between views

### 4. **Check Console Logs**
Expected in Expo Go:
```
[NotificationService] Running in Expo Go - Remote notifications will be skipped
[NotificationService] Skipping notification handler configuration in Expo Go
[NotificationService] Skipping notification listeners in Expo Go
```

**No errors should appear** - only info/warning messages.

### 5. **Test with Development Build (Optional)**
If you want to test push notifications:
```bash
eas build --platform android --profile preview --local
# After build completes, install on device and test
```

---

## Troubleshooting

### Problem: Still seeing "Expo Go Push notifications" error

**Solution**:
1. Clear Metro bundler cache:
   ```bash
   cd mobile-app
   npm start -- --reset-cache
   ```
2. Close Expo Go completely and reopen
3. Rescan QR code

### Problem: App crashes on startup

**Solution**:
1. Check console output for specific error
2. Run with verbose logging:
   ```bash
   npm start -- --max-workers=1
   ```
3. Check if all dependencies are installed:
   ```bash
   npm install
   ```

### Problem: Authentication not working

**Solution**:
1. Verify Supabase credentials in `supabaseClient.js`
2. Check backend server is running at `http://10.210.68.205:5000`
3. Check network connectivity

### Problem: Notifications not received

**Expo Go**: Expected behavior - remote notifications don't work in Expo Go  
**Development Build**: Check:
1. Valid push token was generated
2. Backend is configured to send notifications
3. Check console logs for token registration

---

## Environment Variables to Check

In `mobile-app/supabaseClient.js`, verify:
```javascript
const SUPABASE_URL = 'your_supabase_url'
const SUPABASE_ANON_KEY = 'your_anon_key'
```

In `mobile-app/App.js`, verify:
```javascript
const BACKEND_URL = 'http://10.210.68.205:5000/api'
```

---

## Quick Commands

```bash
# Install dependencies
cd mobile-app && npm install

# Start in Expo Go
npm start

# Start with specific platform
npm run android  # Android
npm run ios      # iOS

# Build development build
eas build --platform android --profile preview --local

# Check for errors
npm start -- --max-workers=1
```

---

## Expected Behavior After Fix

### Expo Go (No Push Notifications):
- App runs smoothly
- All features work except remote push notifications
- Console shows info messages about skipping notifications
- **No error messages**

### Development Build (With Push Notifications):
- App runs smoothly  
- Push notifications work end-to-end
- Can receive and respond to notifications
- Full feature set available

---

## Need Help?

If you still see errors:
1. Share the complete error message
2. Share the console output
3. Verify SDK version: Should be ~55.0.0 or higher
4. Check if using physical device vs emulator

---

**Status**: ✅ Fix implemented for SDK 53+ compatibility
