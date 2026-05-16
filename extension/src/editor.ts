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
    const handleResponse = (e: Event) => {
      window.removeEventListener("lca-code-response", handleResponse);
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        resolve(customEvent.detail);
      } else {
        fallbackExtraction(resolve);
      }
    };
    
    window.addEventListener("lca-code-response", handleResponse);
    window.dispatchEvent(new CustomEvent("lca-request-code"));

    // Safety timeout in case the main world script fails to respond
    setTimeout(() => {
      window.removeEventListener("lca-code-response", handleResponse);
      fallbackExtraction(resolve);
    }, 800);
  });
}

function fallbackExtraction(resolve: (value: string | null) => void) {
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
