
import dedent from 'dedent'
import { processor } from '../src/index.js'

const process = md => {
  return processor()
    .processSync(md)
    .toString()
}

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
