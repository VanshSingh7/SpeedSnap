# SpeedSnap ⚡

> **High-Precision Browser-Native Internet Speed Test & Network Diagnostics with Gemini AI**

SpeedSnap is a modern, client-side network diagnostics dashboard built purely on vanilla web standards. Unlike traditional speed tests that only display peak megabits per second, SpeedSnap analyzes end-to-end network health: loaded latency degradation (**bufferbloat**), packet consistency (**jitter**), **packet loss**, **throughput curves**, real-world application suitability ratings, and **AI-powered diagnostic recommendations** powered by Google Gemini.

Built with **zero external frameworks, zero npm dependencies, and zero backend**. Everything runs natively in the browser.

---

## 🚀 Key Features

### 1. High-Precision Network Benchmark Engine
- **Idle Latency & Jitter**: Multi-probe ping measurement calculating minimum, average, maximum round-trip times (RTT) and Mean Absolute Successive Difference (MASD) jitter.
- **Bufferbloat Detection**: Measures latency delta ($\Delta \text{ms}$) under concurrent download saturation to detect buffer-induced lag.
- **Tiered Download Throughput**: Staggered binary payload transfers (500 KB to 20 MB) computing real-time throughput and 90th percentile speeds.
- **Tiered Upload Throughput**: Generates and transfers `Uint8Array` binary payloads to measure loaded upload capacity.
- **Packet Loss Detection**: Quantifies dropped probes over sequential network bursts.

### 2. Multi-Threaded Web Worker Architecture
- Offloads all intensive network requests, timing loops, blob conversions, and statistical calculations into a dedicated background thread (`js/worker.js`).
- Keeps the browser UI thread running smoothly at a consistent 60 FPS without stutter or dropped frames.
- Full Start and Stop abort control utilizing `AbortController`.

### 3. Dynamic Visual Progress & Live Canvas Charts
- **56-Segment Chevron Progress Bar**: Multi-phase color progression visually indicating benchmark milestones:
  - 🔵 **Blue**: Latency and Jitter calibration
  - 🟡 **Yellow**: Multi-tier Download saturation
  - 🟣 **Purple**: Multi-tier Upload saturation
  - 🔴 **Red**: Packet loss verification
- **Retina-Ready Spline Curves**: Smooth, auto-scaled throughput canvas graphs with gradient fills and live metric tracking (`js/charts.js`).

### 4. Automated Network Quality Scorecard
Instant suitability evaluation for real-world bandwidth scenarios based on latency, jitter, and throughput thresholds:
- 🎬 **Video Streaming**: Great (4K UHD) / Good (1080p) / Fair (720p)
- 🎮 **Online Gaming**: Great (<35 ms RTT, <8 ms jitter) / Good / Fair
- 📞 **Video Calls**: Evaluates bi-directional stability for conferencing platforms (Zoom, Teams, Google Meet)

### 5. Gemini AI Diagnostic Assistant
- Integrates Google's `gemini-3.1-flash-lite` model (`js/gemini.js`) to provide intelligent network engineering advice based on your live benchmark telemetry (throughput, ping, jitter, and bufferbloat).
- Formats actionable tips with clean headings, readable paragraphs, and highlight badges.
- One-click clipboard copy for easy diagnostic sharing.

### 6. Offline Local History & Dashboard (IndexedDB)
- **Zero-Cloud Privacy**: Test history is stored completely on-device in browser `IndexedDB` (`SpeedSnapDB`).
- **Dedicated History Interface (`history.html`)**:
  - Live summary statistics: Total Tests, Average Download, Average Upload, and Average Latency.
  - Interactive search and speed filter.
  - History counter badge synchronized across both navigation bars.
  - One-click historical AI diagnosis and test record deletion.

### 7. Modular Architecture
- Clean separation of concerns designed for easy maintainability, readability, and clarity.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Structure** | Semantic HTML5 | Accessible dashboard layout, clean typography, responsive canvas containers |
| **Styling** | Vanilla CSS3 | Modern dark theme (`#121212`), CSS custom properties, responsive flex/grid layouts |
| **Concurrency** | Web Worker API (`worker.js`) | Background network benchmarking decoupled from UI rendering |
| **Data Visualization** | HTML5 Canvas 2D (`charts.js`) | Retina-ready throughput curves with gradient fills |
| **Persistence** | IndexedDB API (`db.js`) | Client-side persistent storage for historical test benchmarks |
| **Artificial Intelligence** | Gemini REST API (`gemini.js`) | Automated network engineer recommendations using `gemini-3.1-flash-lite` |
| **Edge Endpoints** | Cloudflare Edge Network | High-capacity global speed test endpoints (`__down` and `__up`) |
| **Build Tools** | **None** | Zero dependencies, zero build step, runs natively in any modern browser |

---

## 📁 Project Structure

```text
SpeedSnap/
├── index.html          # Main benchmark dashboard, metrics cards, canvas, control panel
├── history.html        # Local test history dashboard, summary stats, filter toolbar
├── css/
│   └── style.css       # Unified dark theme design system, layout, and modal styles
├── js/
│   ├── config.js       # Endpoints, test sizes, threshold constants, Gemini API config
│   ├── charts.js       # Canvas curve rendering and visual graph routines
│   ├── db.js           # IndexedDB wrapper for CRUD operations and aggregate statistics
│   ├── gemini.js       # Gemini AI diagnostic caller, markdown formatter, and modal controller
│   ├── history.js      # History dashboard controller, filter logic, and UI bindings
│   ├── script.js       # Main page controller, chevron progress, and worker coordinator
│   └── worker.js       # Multi-threaded benchmark worker executing network requests
├── .env                # Local environment configuration for API keys
├── LICENSE             # MIT License
└── README.md           # Project documentation and architecture guide
```

## 🚦 Getting Started

Because SpeedSnap requires no compiler, build tools, or packages, you can run it immediately:

### Option 1: VS Code "Go Live" Extension (Recommended)
1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension (by Ritwick Dey) if not already installed.
3. Right-click on `index.html` and select **"Open with Live Server"** (or click the **"Go Live"** button in the bottom status bar).
4. SpeedSnap will automatically open in your default browser at `http://127.0.0.1:5500`.

### Option 2: Local Static Server
Running through any local static server ensures seamless Web Worker and IndexedDB support:

**Using Python:**
```bash
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

**Using Node.js:**
```bash
npx serve .
```

---

## 🎓 Academic Concepts Demonstrated (CSE Curriculum)

1. **Concurrent Programming & Concurrency**: Multi-threaded execution via Web Workers avoiding UI starvation during I/O operations.
2. **Client-Side Storage Systems**: Structured schema definition, asynchronous transactions, cursor iteration, and aggregate computations using IndexedDB.
3. **Computer Networks & Telemetry**:
   - Round-Trip Time (RTT) measurement.
   - Mean Absolute Successive Difference (MASD) jitter algorithms.
   - Bufferbloat (queueing delay under full link saturation).
   - High-throughput payload chunking and bandwidth calculations.
4. **Data Visualization**: Computer graphics utilizing HTML5 Canvas 2D spline curves.
5. **Modern RESTful AI Integration**: Interfacing with LLM endpoints via HTTP POST requests, prompt design, and safe DOM string parsing.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.