import unified from 'unified'
import markdown from 'remark-parse'
import html from './prettyhtml-stringify.js'
import remark2rehype from 'remark-rehype'

// katex
import math from 'remark-math'
import katex from 'rehype-katex'

// syntax highlighting
import prism from '@mapbox/rehype-prism'
import svelte from '@snlab/refractor-svelte'

// svelte blocks
import svelteBlock from './svelteBlocks.js'
import svelteInline from './svelteInline.js'

// escape curlies
import escapeCurlies from './escapeCurlies.js'

const logger = () => (tree) => { console.log(JSON.stringify(tree, null, 4)); return tree }

export const processor = unified()
  .use(markdown)
  .use(svelteInline)
  .use(svelteBlock)
  .use(math)
  .use(remark2rehype, { allowDangerousHTML: true })
  .use(katex)
  .use(prism, { registerSyntax: [svelte] })
  .use(escapeCurlies)
  .use(html, { allowDangerousHTML: false })

const defaults = {
  extension: '.svelte',
  pluginOptions: {}
}

export function sveltex ({
  extension = '.svelte',
  pluginOptions = {}
} = defaults) {
  return {
    markup: ({ content, filename }) => {
      if (extname(filename) !== extension) return
      const html = processor()
        .processSync(content)
        .toString()
      return {
        code: `${html}`,
        map: ''
      }
    },

    script: ({ content, filename }) => {},

    style: () => {}
  }
}

// replacement of path import
// from https://stackoverflow.com/a/1203361
// thank you wallacer!
function extname (filename) {
  return filename.substring(filename.lastIndexOf('.'), filename.length) || filename
}
