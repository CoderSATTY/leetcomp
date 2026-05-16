import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"],
  world: "MAIN",
  run_at: "document_idle"
}

// Listen for requests from the isolated world
window.addEventListener("lca-request-code", () => {
  let code: string | null = null;
  try {
    // @ts-ignore
    if (window.monaco && window.monaco.editor) {
      // @ts-ignore
      const editors = window.monaco.editor.getEditors();
      
      if (editors && editors.length > 0) {
        // Find the editor that actually has focus or is the main code editor.
        // Usually, the first editor is the main code editor.
        // If there are multiple, we look for the one containing actual code.
        let bestCode = null;
        for (const editor of editors) {
          const val = editor.getValue();
          // LeetCode testcase editor is usually small, the main editor is larger
          if (
            val.includes("class Solution") || 
            val.includes("def ") || 
            val.includes("public class") ||
            val.includes("impl Solution") ||
            val.includes("func ") ||
            val.includes("var ") ||
            val.includes("function ")
          ) {
            bestCode = val;
            break;
          }
        }
        
        // If we didn't find a clear match, just take the first editor's value
        code = bestCode || editors[0].getValue();
      } else {
        // Fallback to models if editors are not instantiated yet
        // @ts-ignore
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          // The last model is often the active one in LeetCode if editors[] fails
          code = models[models.length - 1].getValue();
        }
      }
    }
  } catch (e) {
    console.error("[LC Analyzer] Error extracting code:", e);
  }

  // Send back to the isolated world
  window.dispatchEvent(new CustomEvent("lca-code-response", { detail: code }));
});
