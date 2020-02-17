
import dedent from 'dedent'
import { defaultProcessor } from '../src/index.js'

const process = async md => {
  const result = await defaultProcessor().process(md)
  return result.toString()
}

test('codesandboxplus container processes correctly', async () => {
  const input = await process(dedent`
    ::: codesandboxplus ./test/codesandboxplus/index.svelte some?props - 1-3
    \`\`\`svelte
    \`\`\`
    :::
  `)
  expect(input).toMatchSnapshot()
})
