import { bundleMDX } from "mdx-bundler";
import { refractor } from "refractor";
import { h } from "hastscript";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import parse from "remark-parse";
import directive from "remark-directive";
import powershell from "refractor/lang/powershell.js";

export const getTextAsMdx = async (
  text: string,
  highlightTerm?: string
): Promise<any> => {
  // refractor.register(pms);
  refractor.register(powershell);
  refractor.alias({ powershell: ["dos"] });

  // En el texto markdown, agregar :mark[highlight] para luego generar
  // indicadores con amarillo del texto "buscado"
  if (highlightTerm) {
    text = text.replace(RegExp(highlightTerm, "gi"), `:mark[${highlightTerm}]`);
  }

  const source = text.trim();

  try {
    const result = await bundleMDX({
      source,
      esbuildOptions(options) {
        options.minify = process.env.NODE_ENV == "production";
        return options;
      },
      cwd: process.cwd() + "/app",
      mdxOptions(options) {
        options.remarkPlugins = [
          ...(options.remarkPlugins ?? []),
          parse, // requerido por "directive"
          directive, // requerido por "markPlugin"
          function markPlugin() {
            // realiza el marcado de las zonas :mark[highlight]
            function ondirective(node) {
              const data = node.data || (node.data = {});
              const hast = h(node.name, node.attributes);
              data.hName = hast.tagName;
              data.hProperties = hast.properties;
            }
            function transform(tree) {
              visit(
                tree,
                ["textDirective", "leafDirective", "containerDirective"],
                ondirective
              );
            }
            return transform;
          }
        ];
        options.rehypePlugins = [
          ...(options.rehypePlugins ?? []),
          function rehypePrism() {
            // Realiza el syntax highlight de zonas marcadas con ```
            const getLanguage = (node) => {
              const className = node.properties.className || [];

              for (const classListItem of className) {
                if (classListItem.slice(0, 9) === "language-") {
                  return classListItem.slice(9).toLowerCase();
                }
              }
              return null;
            };
            function visitor(node, index, parent) {
              if (
                !parent ||
                parent.tagName !== "pre" ||
                node.tagName !== "code"
              ) {
                return;
              }
              const lang = getLanguage(node);
              if (lang === null) {
                return;
              }
              let result;
              try {
                parent.properties.className = (
                  parent.properties.className || []
                ).concat(`language-${lang}`);
                result = refractor.highlight(toString(node), lang);
              } catch (err) {
                console.log("ERROR", err);
                if (/Unknown language/.test(err.message)) {
                  return;
                }
                throw err;
              }
              node.children = result.children;
            }
            function transform(tree) {
              visit(tree, "element", visitor);
            }
            return transform;
          }
        ];
        return options;
      }
    });
    return { code: result.code };
  } catch (err) {
    return { error: (err as Error).message };
  }
};
