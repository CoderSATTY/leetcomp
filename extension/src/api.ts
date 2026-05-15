const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

export interface AnalysisResult {
  time_complexity: string | null;
  space_complexity: string | null;
  hints: string[];
}

const SYSTEM_PROMPT = `You are a concise coding mentor for C++. Analyze LeetCode solutions written exclusively in C++. NEVER give full solutions.

Respond with ONLY a valid JSON object. No markdown, no explanation, no fences.

RULES:
1. IMPORTANT: LeetCode code is provided as a class method (e.g., \`class Solution { ... }\`). This IS considered COMPLETE code. Do NOT treat it as incomplete just because it lacks a \`main()\` function.
2. If the code is genuinely empty or just boilerplate (no logic added yet): set time_complexity and space_complexity to null, and give 1 hint paragraph to get started.
3. If the code has logic: you MUST ANALYZE the algorithm and CALCULATE the actual time complexity and space complexity. Do NOT guess or copy from examples. Format it strictly in Big-O notation.
4. If the solution is already completely optimal for the problem: set "hints" to an empty array [] (i.e., do not give any hints).
5. If the solution is NOT optimal (e.g., brute force, or has bugs): provide EXACTLY ONE hint inside the "hints" array.
6. The hint MUST be a single paragraph of 2-3 lines. It should directly address the user's code, correcting their logic, suggesting a better data structure, or proposing a more optimal method.
7. Important points, variables, or data structure names in the hint MUST be highlighted in **bold** markdown.

EXAMPLES:

Incomplete code:
{"time_complexity": null, "space_complexity": null, "hints": ["It looks like you're just starting. For this problem, consider using an unordered_map to keep track of elements you've already seen. This will allow you to achieve O(1) lookups instead of scanning the array multiple times."]}

Complete brute force (not optimal):
{"time_complexity": "O(N^2)", "space_complexity": "O(1)", "hints": ["Your logic uses nested loops which results in quadratic time. Try changing your approach to use a hash map to store values as you iterate in a single pass, dropping the time complexity to O(N)."]}

Complete and optimal:
{"time_complexity": "O(N)", "space_complexity": "O(N)", "hints": []}

RESPOND WITH ONLY THE JSON OBJECT.`;

export async function getApiKey(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["GROQ_API_KEY"], (result) => {
      resolve(result.GROQ_API_KEY || null);
    });
  });
}

export async function setApiKey(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ GROQ_API_KEY: key }, () => {
      resolve();
    });
  });
}

export async function analyzeCode(
  code: string,
  language: string,
  problemTitle?: string
): Promise<AnalysisResult> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  let user_msg = `Language: ${language}\n`;
  if (problemTitle) user_msg += `Problem: ${problemTitle}\n`;
  user_msg += `\nCode:\n\`\`\`\n${code}\n\`\`\``;

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user_msg }
      ],
      temperature: 0.3,
      max_tokens: 512
    })
  });

  if (!res.ok) {
    throw new Error(`Groq API error: ${res.status}`);
  }

  const data = await res.json();
  let content = data.choices[0].message.content.trim();

  if (content.startsWith("```")) {
    content = content.split("\n").slice(1).join("\n");
    if (content.endsWith("```")) {
      content = content.substring(0, content.length - 3);
    }
    content = content.trim();
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error("Invalid JSON from LLM");
  }
}
