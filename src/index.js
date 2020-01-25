import unified from 'unified'
import markdown from 'remark-parse'
import html from 'rehype-stringify'
import remark2rehype from 'remark-rehype'

// katex
import math from 'remark-math'
import katex from 'rehype-katex'

// syntax highlighting
import prism from '@mapbox/rehype-prism'
import svelte from '@snlab/refractor-svelte'

// svelte blocks
import svelteBlock from './svelteBlocks.js'

const logger = () => (tree) => { console.log(JSON.stringify(tree, null, 4)); return tree }

export const processor = unified()
  .use(markdown)
  // .use(svelteBlock)
  .use(math)
  .use(logger)
  .use(remark2rehype)
  .use(katex)
  .use(prism, { registerSyntax: [svelte] })
  .use(html)
