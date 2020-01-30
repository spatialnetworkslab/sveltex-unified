import dedent from 'dedent'
import { processor } from '../src/index.js'

const process = async (md) => {
  const result = await processor()
    .process(md)
  return result.toString()
}

test('process basic markdown correctly', async () => {
  const input = await process(dedent`
      # test
  `)
  const output = dedent`
      <h1>test</h1>
  `
  expect(input).toBe(output)
})

test('process math inline equation', async () => {
  const input = await process(dedent`
      Inline equation $x + 1$
  `)
  expect(input).toMatchSnapshot()
})

test('process math block equation', async () => {
  const input = await process(dedent`
      Using a block equation:

      $$
      x + 1
      $$

      Continue with normal paragraph
  `)
  expect(input).toMatchSnapshot()
})

test('highlight code block syntax', async () => {
  const input = await process(dedent`
  \`\`\`js
  var x = 1
  \`\`\`
  `)
  expect(input).toMatchSnapshot()
})

test('highlight code block html syntax', async () => {
  const input = await process(dedent`
  \`\`\`html
  <li>my list item</li>
  \`\`\`
  `)
  expect(input).toMatchSnapshot()
})

test('highlight svelte syntax', async () => {
  const input = await process(dedent`
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

test('curlies in code blocks are escaped', async () => {
  const input = await process(dedent`
      \`\`\`svelte
      {#if x > 10}
        <p>{x} is greater than 10</p>
      {/if}
    \`\`\`
  `)
  expect(input).toMatchSnapshot()
})

test('paragraphs within else-if blocks should be terminated', async () => {
  const input = await process(dedent`
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

test('codesandbox container processes correctly', async () => {
  const input = await process(dedent`
    ::: codesandbox ./test/codesandbox/ some?props
    :::
  `)
  expect(input).toMatchSnapshot()
})

test('default container processes correctly', async () => {
  const input = await process(dedent`
    ::: div testClass
      some text here
    :::
  `)
  expect(input).toMatchSnapshot()
})
