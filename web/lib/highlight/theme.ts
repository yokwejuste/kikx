import { createCssVariablesTheme, type ThemeRegistration } from "shiki/core";

const variable = (name: string) => `var(--syntax-${name})`;

const base = createCssVariablesTheme({ name: "kikx", variablePrefix: "--syntax-", fontStyle: true });

export const kikxTheme: ThemeRegistration = {
  ...base,
  tokenColors: [
    ...(base.tokenColors ?? []),
    {
      scope: [
        "entity.name.tag",
        "entity.name.type.hcl",
        "entity.name.type.terraform",
        "entity.name.section",
        "entity.other.attribute-name",
        "variable.declaration",
        "variable.other.readwrite.hcl",
        "variable.other.readwrite.terraform",
        "keyword.other.definition.ini",
        "support.type.property-name",
        "keyword.key.toml",
      ],
      settings: { foreground: variable("token-keyword") },
    },
    {
      scope: ["variable.other.enummember", "string.unquoted", "string.quoted"],
      settings: { foreground: variable("token-string") },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.other.option"],
      settings: { foreground: variable("token-constant") },
    },
    {
      scope: [
        "keyword.operator",
        "punctuation",
        "punctuation.separator.key-value",
        "punctuation.definition.block.sequence.item.yaml",
        "punctuation.definition.string",
      ],
      settings: { foreground: variable("token-punctuation") },
    },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: variable("token-comment"), fontStyle: "italic" },
    },
  ],
};
