import dedent from 'dedent'
import { processor } from '../src/index.js'

const process = md => {
  return processor()
    .processSync(md)
    .toString()
}

test('process basic markdown correctly', () => {
  const input = process(dedent`
      # test
  `)
  const output = dedent`
      <h1>test</h1>
  `
  expect(input).toBe(output)
})

test('process math inline equation', () => {
  const input = process(dedent`
      Inline equation $x + 1$
  `)
  expect(input).toMatchSnapshot()
})

test('process math block equation', () => {
  const input = process(dedent`
      Using a block equation:

      $$
      x + 1
      $$

      Continue with normal paragraph
  `)
  expect(input).toMatchSnapshot()
})

test('highlight code block syntax', () => {
  const input = process(dedent`
  \`\`\`js
  var x = 1
  \`\`\`
  `)
  expect(input).toMatchSnapshot()
})

test('highlight code block html syntax', () => {
  const input = process(dedent`
  \`\`\`html
  <li>my list item</li>
  \`\`\`
  `)
  expect(input).toMatchSnapshot()
})

test('highlight svelte syntax', () => {
  const input = process(dedent`
  \`\`\`svelte
    <script>
      let x = 7;
    </script>

    {#if x > 10}
      <p>{x} is greater than 10</p>
    {:else if 5 > x}
      <p>{x} is less than 5</p>
    {:else}
      <p>{x} is between 5 and 10</p>
    {/if}
  \`\`\`
  `)
  expect(input).toMatchSnapshot()
})

test('curlies in code blocks are escaped', () => {
  const input = process(dedent`
      \`\`\`svelte
      {#if x > 10}
        <p>{x} is greater than 10</p>
      {/if}
    \`\`\`
  `)
  expect(input).toMatchSnapshot()
})

test('paragraphs within else-if blocks should be terminated', () => {
  const input = process(dedent`
    {#if a < 10}
    One
    {:else if a == 10}
    Two
    {:else}
    Three
    {/if}
  `)
  expect(input).toMatchSnapshot()
})
