# Sveltex
Sveltex is a Markdown preprocessor for Svelte projects. It allows you to add markdown syntax to your Svelte apps and components. Similar to MDX, it uses Remark and [Unified](https://unifiedjs.com/) under the hood. 

This project draws heavy inspiration from a lot of amazing open-source projects:
- [MDsveX](https://github.com/pngwn/MDsveX) - another Markdown preprocessor for Svelte projects made by [pngwn](https://github.com/pngwn). Built on top of `markdown-it` instead. Likely to be a better choice for most use cases.
- [Idyll](https://idyll-lang.org/) - much more than just a preprocessor but a language and toolkit for interactive content. Uses React under the hood.
- [Vuepress](https://vuepress.vuejs.org/) – static site generator based on Vue. Apart from making solid choices for Markdown pre-processing, is a super low-barrier entry to content-heavy web projects based on Markdown.
- [Unified](https://unifiedjs.com/) – provides building blocks (and syntax trees) that make it easier to transform and reason about (interactive) content.

## Installation and configuration

```bash
npm install -D @snlab/sveltex-unified
```

Modify the `rollup.config.js` file in the svelte project to include the sveltex preprocessor:

```js
import { sveltex } from '@snlab/sveltex-unified';

export default {
	<!-- OTHER_CONFIG_STUFF -->
	plugins: [
		svelte({
			<!-- MORE_CONFIG_STUFF -->
			preprocess: sveltex({}),
		}),
	]
}
```

## Using Sveltex
Sveltex supports [generic markdown syntax](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet), including headers, links, code blocks and others.

```
# I AM A HEADER

## I AM A SMALLER HEADER
```

As part of the svelte compiler ecosystem, sveltex works with most svelte syntax, including conditional rendering.

```
{#if visible}

Now you see me

{:else}

Now you don't

{/if}
```

## Executable code
Executable code can be declared using the svelte `<script></script>` tag or within additional executable code blocks using the `js exec` tag.

````markdown
```js exec
import Test from './Test.svelte'

let variable = 'pear'
```

<Test />

I am a { variable }
````

Code within a `js exec` code block will be executed exactly as code within the svelte `<script></script>` tags. Multiple `js exec` code blocks can be declared anywhere within a single sveltex document.

## exec echo
Sometimes, it is desirable to display code within a code block and then demonstrate the results of that code block immediately afterwards.

For this purpose there are two special code block tags: `js exec echo` and `html exec echo`.

Contents within `js exec echo` will be displayed in a code block and then evaluated as in `js exec` or `<script>` tags.

````markdown
```js exec echo

let h = 'I am a variable but I render nothing'

```
````

Contents within `html exec echo` will be displayed in a code block and then rendered immediately afterwards.


````markdown
```html exec echo

<h1>I am both code block and header HTML element</h1>

```
````

## Styling html exec echo

Unlike all other code blocks, the `html exec echo` block renders twice: once as a regular code block, and once as the actual html content. By default, the two renderings are done linearly one after the other.

In order to make it easier to customize their style and position, the code block has a default class of `echo_html` while the actual html render has a class of `exec_html`.

These classes can be styled separately using css in the markdown document as follows:
```html
.echo_html {
	width: 50%;
}

.exec_html {
	width: 50%
}
```

## Code blocks

Regular code blocks still work as usual. They come with default Prism syntax highlighting, including for Svelte syntqx

````markdown
```js

let variable = 'I am not executable'

```
````

All curlies within regular code blocks are also escaped and will be rendered as is.

````markdown
```js

let objects = { cat: 'dogs', fish: 'chips' }

```
````

## Components

Imported Svelte components can also be used within the markdown/Svelte syntax.

## Enable/Disable plugins
Sveltex is built on top of the Remark and [Unified](https://unifiedjs.com/) universe. This means that additional plugins and transformers can be added as needed. Apart from exporting a default preprocessor as `sveltex`, we also export individual plugins as well as a convenience function to turn a unified processor into a Svelte pre-processor. To recreate the default sveltex processor, you would use the following unified pipeline

```js
const defaultProcessor = unified()
  .use(markdown, { blocks: blocks }) // remark-parse with custom (svelte) blocks 
  .use(frontmatter) // yaml frontmatter 
  .use(parseFrontmatter)
  .use(copyFrontmatter) // make frontmatter available on vfile
  .use(containers, { // custom containers including for csb and hiding solutions in <details>
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
  .use(solutionHide)
  .use(csbUpload) // post csb blocks to codesandbox if needed
  .use(svelteInline) // make sure svelte blocks and elements get processed correctly
  .use(svelteBlock)
  .use(svelteElementBlock)
  .use(svelteElementInline)
  .use(math) // inline/block math
  .use(execCodeBlocks) // allow code blocks to become 'executable'
  .use(remark2rehype, { allowDangerousHTML: true }) // convert to html tree
  .use(katex) // process math blocks with katex
  .use(prism, { registerSyntax: [svelteSyntax] }) // syntax highlight
  .use(escapeCurlies) // escape curlies in code blocks
  .use(html, { allowDangerousHTML: false }) // express tree as html

const sveltex = makeSveltePreprocessor(defaultProcessor) // convert processor to svelte preprocessor
```

## Katex and Math Expressions
The Sveltex preprocessor supports rendering of math expressions using the [katex](https://katex.org/) syntax.

Inline math expressions can be included in text and html using the katex inline `$` markers.

```
This will be rendered as a katex expression: $\sqrt{x-1}+(1+x)^2$
```

Katex blocks are also supported.

```
$$\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}$$
```