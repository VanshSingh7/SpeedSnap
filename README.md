# SpeedSnap

Speed is only half the story.

SpeedSnap is an internet speed test that measures more than raw Mbps. 
It grades **bufferbloat** (how much your latency degrades under load), 
scores **connection stability** (how consistent your speed is across runs), 
and translates results into real-world terms (buffering time, download time).

## Features
- Concurrent download/upload testing via a Web Worker pool
- Live throughput graph using Canvas, streamed via `ReadableStream`
- Latency measured unloaded vs. under load (bufferbloat detection)
- Stability score based on coefficient of variation across test runs
- Zero backend — built entirely with vanilla HTML/CSS/JS

## Tech
Vanilla JavaScript, Web Workers, Canvas API, Fetch Streaming API. 
No frameworks, no build step, no backend.

## Why
Most speed testers show a single number. SpeedSnap tries to answer 
the more useful question: *does this connection actually feel good 
to use* — for gaming, calls, and streaming — not just how fast it 
is on paper.