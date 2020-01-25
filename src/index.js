import unified from 'unified'
import markdown from 'remark-parse'
import html from 'rehype-stringify'
import remark2rehype from 'remark-rehype'

// katex
import math from 'remark-math'
import katex from 'rehype-katex'

export const processor = unified()
  .use(markdown)
  .use(math)
  .use(remark2rehype)
  .use(katex)
  .use(html)
