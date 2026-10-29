import { marked } from 'marked';

/** Inline Markdown (emphasis, links; no paragraphs) as HTML, for `set:html`. */
export const inlineMarkdown = (text: string) => marked.parseInline(text, { async: false });
