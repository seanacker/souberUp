# Soberup

Share your weekly phone usage with friends to build positive social pressure against excessive mobile use.

See `ARCHITECTURE.md` for full MVP scope and system design.

## Prerequisites
- Node.js >= 20.19.4 (Expo/React Native 0.81 requires this minimum)
- npm >= 10
- Java JDK 21 (OpenJDK is fine)
- Android SDK + Emulator (Android 12 / API 31+)
- Python 3.11+ (for backend)

On Windows (PowerShell), verify:
```powershell
node -v
npm -v
java -version
adb devices
```

## Backend quickstart (FastAPI)
For more detail, see `backend/README.md`.
```powershell
# From repo root
python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install -r backend\requirements.txt

python -m uvicorn backend.app.main:app --reload --port 8000
# Open: http://127.0.0.1:8000/docs
```

## Mobile app quickstart (Expo React Native)
```powershell
# From repo root
cd mobile
npm install --no-audit --no-fund

# Start an emulator or connect a device
emulator -list-avds
emulator -avd <YourAVDName>
# In another shell, start the app
npm run android
# or
npx expo start --android --non-interactive
```

### Notes
- If you see Node engine warnings, update Node to 20.19.4 or later.
- Ensure one emulator/device is shown by `adb devices` before running `android`.
- Metro bundler runs on `http://127.0.0.1:8081`. Expo dev server typically on `http://127.0.0.1:19000`.
- To lint the mobile app: `npm run lint` inside `mobile/`.



