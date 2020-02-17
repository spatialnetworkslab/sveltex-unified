
import dedent from 'dedent'
import { defaultProcessor } from '../src/index.js'

const process = async md => {
  const result = await defaultProcessor().process(md)
  return result.toString()
}

test('codesandboxplus container processes correctly', async () => {
  const input = await process(dedent`
    ::: codesandboxplus ./test/codesandboxplus/App.svelte 1-3
    :::
  `)
  expect(input).toMatchSnapshot()
})

test('codesandboxplus container with split line numbers', async () => {
  const input = await process(dedent`
    ::: codesandboxplus ./test/codesandboxplus/App.svelte 6,9
    :::
  `)
  expect(input).toMatchSnapshot()
})
