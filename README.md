# LeetComp

A standalone Chrome extension that acts as your personal LeetCode AI mentor. It analyzes your solutions in real-time to calculate time/space complexity and provides subtle optimization hints without spoiling the final answer.

**Not a cheat tool** — hints guide you toward better solutions without revealing them.

## Architecture

```
LeetComp Extension (Plasmo/React)  →  Groq API  →  JSON response
```

Completely serverless. The extension stores your Groq API key securely in `chrome.storage.local` and sends your code directly to the Groq API — no backend server, no middleman, zero latency.

## Setup

### 1. Get a Free Groq API Key

Sign up at [console.groq.com](https://console.groq.com) and generate an API key. It's free.

### 2. Extension

```bash
cd extension
npm install
npm run dev
```

Then load in Chrome:
1. Go to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select `extension/build/chrome-mv3-dev`
5. Open any LeetCode problem page

### 3. Docker (deploy)

```bash
cp backend/.env.example backend/.env
# Edit .env with your GROQ_API_KEY
docker-compose up --build
```

## How It Works

1. Extension polls LeetCode's Monaco editor for code changes
2. After 2s debounce, sends code + language + problem title to backend
3. Backend sends to Groq with a system prompt that enforces JSON output
4. If code is incomplete → `time_complexity` and `space_complexity` are `null`
5. If code is complete → returns Big-O analysis + 1-3 optimization hints
6. Extension renders results in a draggable overlay

## API

**POST /analyze**
```json
{
  "code": "def twoSum(self, nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i]+nums[j]==target: return [i,j]",
  "language": "python",
  "problem_title": "Two Sum"
}
```

Response:
```json
{
  "time_complexity": "O(n²)",
  "space_complexity": "O(1)",
  "hints": [
    "Consider using a hashmap for O(1) lookups instead of the inner loop",
    "You can solve this in a single pass through the array"
  ]
}
```

## Project Structure

```
leetcomp/
├── extension/
│   ├── src/
│   │   ├── contents/
│   │   │   └── leetcode.tsx # Content script (full UI)
│   │   ├── api.ts           # Groq API client (direct)
│   │   ├── editor.ts        # Monaco code extraction
│   │   └── overlay.css      # Styles
│   ├── package.json
│   └── tsconfig.json
├── imgs/                    # Chrome Web Store assets
├── PRIVACY.md
└── README.md
```

## Privacy

See [PRIVACY.md](./PRIVACY.md). LeetComp collects zero user data.
