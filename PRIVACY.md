# Privacy Policy — LeetComp

**Last Updated: May 2026**

## Overview

LeetComp is a Chrome extension that helps developers analyze the time and space complexity of their LeetCode solutions using AI.

## Data Collection

**LeetComp does not collect, store, sell, or transmit any personally identifiable information.**

## How Your Data Is Used

| Data | What happens to it |
|------|-------------------|
| **Groq API Key** | Stored securely and locally on your own device using Chrome's `storage.local` API. It never leaves your browser except to authenticate directly with Groq's servers. |
| **Code Snippets** | Sent directly from your browser to the Groq API for analysis. They are never intercepted, saved, or monitored by the developer. |
| **LeetCode Problem Title** | Sent alongside your code to Groq solely to provide context for the analysis. Not stored anywhere. |

## Third-Party Services

LeetComp communicates exclusively with the **Groq API** (`api.groq.com`). Please review [Groq's Privacy Policy](https://groq.com/privacy-policy/) to understand how they handle API request data.

## Permissions Used

| Permission | Why it's needed |
|------------|----------------|
| `storage` | To save your Groq API key locally on your device across sessions. |
| `activeTab` | To read the code from your currently active LeetCode problem tab. |

## No Tracking

- No analytics or telemetry
- No cookies or fingerprinting
- No data sent to any developer-controlled server
- No account required

## Contact

If you have questions or concerns about this privacy policy, please open an issue at the GitHub repository's [Issues tab](https://github.com/CoderSATTY/leetcomp/issues).
