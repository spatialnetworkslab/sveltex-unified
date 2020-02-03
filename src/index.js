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
import htmlBlocks from 'remark-parse/lib/block-elements.js'
import svelteElementBlock from './svelteElementBlocks.js'
import svelteElementInline from './svelteElementInline.js'

// escape curlies
import escapeCurlies from './escapeCurlies.js'

// containers
import containers from 'remark-containers'
import csbBlock from './codeSandBoxBlock.js'
import csbUpload from './codeSandBoxUpload.js'
import solution from './solutions.js'

// exec code blocks
import execCodeBlocks from './execCodeBlocks.js'

const blocks = htmlBlocks.concat([
  'svelte:self',
  'svelte:component',
  'svelte:window',
  'svelte:body',
  'svelte:head',
  'svelte:options'
])
const logger = () => (tree) => { console.log(JSON.stringify(tree, null, 4)); return tree }

export const processor = unified()
  .use(markdown, { blocks: blocks })
  .use(containers, {
    default: true,
    custom: [
      {
        type: 'codesandbox',
        element: 'iframe',
        transform: csbBlock
      },
      {
        type: 'solution',
        element: 'div',
        transform: solution
      }
    ]
  })
  .use(csbUpload)
  .use(svelteInline)
  .use(svelteBlock)
  .use(svelteElementBlock)
  .use(svelteElementInline)
  .use(math)
  .use(execCodeBlocks)
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
    markup: async ({ content, filename }) => {
      if (extname(filename) !== extension) return
      const result = await processor()
        .process(content)
      const html = result.toString()
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
