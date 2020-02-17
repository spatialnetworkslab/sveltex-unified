import unified from 'unified'
import markdown from 'remark-parse'
import html from './prettyhtml-stringify.js'
import remark2rehype from 'remark-rehype'

// katex
import math from 'remark-math'
import katex from 'rehype-katex'

// syntax highlighting
import prism from '@mapbox/rehype-prism'
import svelteSyntax from '@snlab/refractor-svelte'

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
import csbBlockPlus from './codeSandBoxBlockPlus.js'
import csbUploadPlus from './codeSandBoxUploadPlus.js'
import solution from './solutions.js'
import solutionHide from './solutionhide.js'

// frontmatter
import frontmatter from 'remark-frontmatter'
import parseFrontmatter from 'remark-parse-yaml'
import copyFrontmatter from './frontmatterData.js'

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

// replacement of path import
// from https://stackoverflow.com/a/1203361
// thank you wallacer!
function extname (filename) {
  return filename.substring(filename.lastIndexOf('.'), filename.length) || filename
}

const logger = () => (tree) => { console.log(JSON.stringify(tree, null, 4)); return tree }

export const defaultProcessor = unified()
  .use(markdown, { blocks: blocks })
  .use(frontmatter)
  .use(parseFrontmatter)
  .use(copyFrontmatter)
  .use(containers, {
    default: true,
    custom: [
      {
        type: 'codesandbox',
        element: 'iframe',
        transform: csbBlock
      },
      {
        type: 'codesandboxplus',
        element: 'div',
        transform: csbBlockPlus
      },
      {
        type: 'solution',
        element: 'div',
        transform: solution
      }
    ]
  })
  .use(solutionHide)
  .use(csbUpload)
  .use(csbUploadPlus, {
    rangeLegend: (beg, end) => ''
    /* You can overwrite range legend here
     * By default its `//<!-- line ${beg} to ${end} -->//\n`
     */
    // rangeLegend: (beg, end) => `//<!-- line ${beg} to ${end} -->//\n`
  })
  .use(svelteInline)
  .use(svelteBlock)
  .use(svelteElementBlock)
  .use(svelteElementInline)
  .use(math)
  .use(execCodeBlocks)
  .use(remark2rehype, { allowDangerousHTML: true })
  .use(katex)
  .use(prism, { registerSyntax: [svelteSyntax] })
  .use(escapeCurlies)
  .use(html, { allowDangerousHTML: false })

const defaults = {
  extension: '.svelte',
  pluginOptions: {}
}

export const sveltex = makeSveltePreprocessor(defaultProcessor)

// export plugins and other necessary parts for setting up your own processor
export {
  blocks, copyFrontmatter, csbBlock, solution,
  solutionHide, csbUpload, svelteInline, svelteBlock,
  svelteElementBlock, svelteElementInline, execCodeBlocks,
  svelteSyntax, escapeCurlies
}

// convenience function to create a svelte preprocessor from a unified processor
export function makeSveltePreprocessor (processor) {
  return function ({
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
      script: () => {},
      style: () => {}
    }
  }
}
