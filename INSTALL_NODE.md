# Node.js Installation Required

The error `npm : Die Benennung "npm" wurde nicht als Name...` means that **Node.js is not installed** or your computer doesn't know where to find it.

## Step 1: Download Node.js
1.  Go to **[https://nodejs.org/](https://nodejs.org/)**.
2.  Download the **LTS (Long Term Support)** version for Windows.

## Step 2: Install
1.  Run the downloaded installer (`.msi` file).
2.  Click "Next" through the setup.
3.  **IMPORTANT**: On the "Custom Setup" screen, ensure **"Add to PATH"** is selected (it usually is by default).
4.  Finish the installation.

## Step 3: Restart
1.  **Close all open terminals and VS Code windows.** This is critical so the new settings are loaded.
2.  Re-open VS Code or your terminal.

## Step 4: Verify
1.  Open a new terminal.
2.  Type `node -v` and press Enter. You should see a version number (e.g., `v20.11.0`).
3.  Type `npm -v` and press Enter. You should see a version number.

## Step 5: Run the Agent
Once verified, navigate back to your project folder and run:

```powershell
cd "c:\Users\enzoc\Desktop\ai code\antigravity agent notion"
npm install
npm start
```
