import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/problems/*"],
  world: "MAIN",
  run_at: "document_idle"
}

// Listen for requests from the isolated world
window.addEventListener("lca-request-code", () => {
  let code: string | null = null;
  let language: string | null = null;
  try {
    // @ts-ignore
    if (window.monaco && window.monaco.editor) {
      // @ts-ignore
      const editors = window.monaco.editor.getEditors();
      
      if (editors && editors.length > 0) {
        // Find the editor that actually has focus or is the main code editor.
        let bestCode = null;
        let bestLang = null;
        for (const editor of editors) {
          const val = editor.getValue();
          if (
            val.includes("class Solution") || 
            val.includes("def ") || 
            val.includes("public class") ||
            val.includes("impl Solution") ||
            val.includes("func ") ||
            val.includes("var ") ||
            val.includes("function ") ||
            val.includes("class ")
          ) {
            bestCode = val;
            bestLang = editor.getModel()?.getLanguageId?.();
            break;
          }
        }
        
        code = bestCode || editors[0].getValue();
        language = bestLang || editors[0].getModel()?.getLanguageId?.() || null;
      } else {
        // Fallback to models if editors are not instantiated yet
        // @ts-ignore
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          const model = models[models.length - 1];
          code = model.getValue();
          language = model.getLanguageId?.() || null;
        }
      }
    }
  } catch (e) {
    console.error("[LC Analyzer] Error extracting code:", e);
  }

  // Send back to the isolated world
  window.dispatchEvent(new CustomEvent("lca-code-response", { detail: { code, language } }));
});
