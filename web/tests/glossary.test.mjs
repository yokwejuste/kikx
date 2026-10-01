import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function glossaryPages() {
  const block = read("../lib/glossary/terms.ts").match(/const GLOSSARY = \{([^}]*)\}/)[1];
  return Object.fromEntries([...block.matchAll(/(\w+): "([^"]+)"/g)].map(([, term, page]) => [term, page]));
}

const pages = glossaryPages();

test("the glossary lists terms", () => {
  assert.ok(Object.keys(pages).length > 0);
});

test("every glossary term links to an existing docs page", () => {
  for (const [term, page] of Object.entries(pages)) {
    assert.ok(existsSync(new URL(`../../docs/source/${page}.md`, import.meta.url)), `${term} links to missing ${page}`);
  }
});

test("every glossary term has a name and definition in each locale", () => {
  for (const locale of ["en", "fr"]) {
    const { terms } = JSON.parse(read(`../messages/${locale}.json`)).glossary;
    assert.deepEqual(Object.keys(terms).sort(), Object.keys(pages).sort(), locale);
    for (const [term, { term: name, definition }] of Object.entries(terms)) {
      assert.ok(name && definition, `${locale} ${term}`);
    }
  }
});
