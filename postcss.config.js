import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

/**
 * Tailwind (v3) can emit declarations without `source` (e.g. before:/after:
 * variants and some @layer utilities). Vite's url-rewrite plugin then warns:
 * "A PostCSS plugin did not pass the `from` option to `postcss.parse`".
 * Attach the root file source so Vite can resolve asset URLs correctly.
 */
function ensureDeclSource() {
  return {
    postcssPlugin: "ensure-decl-source",
    Once(root) {
      const fallback = root.source;
      if (!fallback?.input) return;
      root.walkDecls((decl) => {
        if (!decl.source?.input?.file) {
          decl.source = fallback;
        }
      });
    },
  };
}
ensureDeclSource.postcss = true;

export default {
  plugins: [tailwindcss, autoprefixer, ensureDeclSource()],
};
