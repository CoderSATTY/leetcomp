/**
 * Extract code from LeetCode's Monaco editor.
 * Tries multiple methods with DOM fallback.
 */

interface MonacoWindow extends Window {
  monaco?: {
    editor?: {
      getEditors?: () => Array<{ getValue: () => string }>;
      getModels?: () => Array<{ getValue: () => string; getLanguageId: () => string }>;
    };
  };
}

export async function extractCode(): Promise<string | null> {
  return new Promise((resolve) => {
    const resEventId = "lca-code-res-" + Math.random().toString(36).substring(7);

    const handleResponse = (e: Event) => {
      window.removeEventListener(resEventId, handleResponse);
      const customEvent = e as CustomEvent;
      resolve(customEvent.detail);
    };
    window.addEventListener(resEventId, handleResponse);

    const script = document.createElement("script");
    script.textContent = `
      (function() {
        try {
          let code = null;
          if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            let bestCode = null;
            for (let i = 0; i < models.length; i++) {
              const val = models[i].getValue();
              if (val.includes("class Solution") || val.includes("def ") || val.includes("public class")) {
                bestCode = val;
                break;
              }
            }
            if (!bestCode && models.length > 0) {
              // Fallback to the last model, which is often the user's active editor
              bestCode = models[models.length - 1].getValue();
            }
            code = bestCode;
          }
          if (code) {
            window.dispatchEvent(new CustomEvent("${resEventId}", { detail: code }));
          }
        } catch(e) {
          // ignore
        }
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();

    setTimeout(() => {
      window.removeEventListener(resEventId, handleResponse);
      const viewLines = document.querySelector(".view-lines");
      if (viewLines) {
        const lines: string[] = [];
        viewLines.querySelectorAll(".view-line").forEach((el) => {
          lines.push(el.textContent || "");
        });
        resolve(lines.join("\\n"));
      } else {
        resolve(null);
      }
    }, 500);
  });
}

export function detectLanguage(): string {
  try {
    // Check language selector buttons on LeetCode
    const selectors = [
      "button[class*='lang']",
      "[data-cy='lang-select']",
      "button[id*='headlessui-listbox-button']",
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent) {
        const raw = el.textContent.trim().toLowerCase();
        const map: Record<string, string> = {
          python3: "python", python: "python", "c++": "cpp", cpp: "cpp",
          java: "java", javascript: "javascript", typescript: "typescript",
          go: "go", rust: "rust", c: "c",
        };
        return map[raw] || raw;
      }
    }

    return "cpp";
  } catch {
    return "cpp";
  }
}

export function extractProblemTitle(): string | null {
  try {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    if (match) {
      return match[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return null;
  } catch {
    return null;
  }
}
