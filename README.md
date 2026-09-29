# SpeedSnap ⚡

SpeedSnap is a simple, browser-based internet speed and network diagnostic tool. It tests your download speed, upload speed, ping, jitter, and bufferbloat in real time, without needing any external software or complex setup.

---

## 🌟 What SpeedSnap Does & Key Benefits

- **Complete Connection Checks**: Measures download and upload speeds along with idle ping, jitter, and bufferbloat (lag under load).
- **Flexible Test Toggles**: Easily switch and choose which tests you want to run (latency, download, upload) before starting.
- **Smooth Performance**: Runs all heavy network tests in the background using Web Workers, so the page and charts stay smooth and responsive.
- **Local History (IndexedDB)**: Saves your past speed test results directly in your browser using IndexedDB. No accounts, no database to install, and your data stays private on your machine.
- **AI Suggestions (Gemini API)**: Uses Google Gemini AI to review your network results and suggest simple, practical ways to fix lag, improve gaming, or boost streaming quality.

---

## 📋 Prerequisites

To run SpeedSnap on your computer, you only need:

1. **A Modern Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave.
2. **A Simple Local Server**: Because browsers protect Web Workers, run the project through:
   - **VS Code with Live Server Extension** (recommended), or
   - **Python** (if installed on your computer), or
   - **Node.js** (`npx serve`)
3. *(Optional)* **Gemini API Key**: If you want AI network suggestions, you can get a free API key from [Google AI Studio](https://aistudio.google.com/) and place it in a `.env` file.

---

## 🚀 How to Run SpeedSnap (Step-by-Step)

### Step 1: Open the Project
Open the SpeedSnap folder in **Visual Studio Code**.

### Step 2: (Optional) Set up your Gemini API Key
If you want to use the AI suggestions feature:
1. Create a file named `.env` in the root folder (if not already there).
2. Add your key inside:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Step 3: Start the Application

#### Option A: Using VS Code "Go Live" (Easiest)
1. Install the **Live Server** extension in VS Code if you don't have it.
2. Right-click on `index.html` and click **"Open with Live Server"**, or click the **Go Live** button at the bottom right corner of VS Code.
3. Your browser will automatically open `http://127.0.0.1:5500`.

#### Option B: Using Python
Open your terminal in the project folder and run:
```bash
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

#### Option C: Using Node.js
Open your terminal in the project folder and run:
```bash
npx serve .
```

### Step 4: Run a Test
1. Click **Start Test** on the main dashboard.
2. Watch the live speed gauges and canvas charts update in real time.
3. Once completed, view your quality score (Streaming, Gaming, Calls) or click **AI Suggestion** for personalized tips.
4. Click **History** in the top navigation to view your saved past tests and stats.

---

## 📁 Project Structure

```text
SpeedSnap/
├── index.html       # Main speed test dashboard
├── history.html     # Past test records and statistics
├── css/
│   └── style.css    # Clean dark theme styling
├── js/
│   ├── config.js    # Settings and endpoint configurations
│   ├── worker.js    # Background network benchmark engine
│   ├── script.js    # Main dashboard UI logic
│   ├── charts.js    # Live speed and ping canvas charts
│   ├── db.js        # IndexedDB storage helper
│   ├── gemini.js    # Gemini AI recommendations helper
│   └── history.js   # History page logic
├── .env             # Your local Gemini API key (ignored by git)
└── README.md        # Documentation
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).