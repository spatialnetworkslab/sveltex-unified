import unified from 'unified'
import markdown from 'remark-parse'
import html from 'rehype-stringify'
import remark2rehype from 'remark-rehype'

export const processor = unified()
  .use(markdown)
  .use(remark2rehype)
  .use(html)
