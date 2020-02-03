
import dedent from 'dedent'
import { processor } from '../src/index.js'

const process = async (md) => {
  const result = await processor()
    .process(md)
  return result.toString()
}

test('process html exec echo code block', async () => {
  const input = await process(dedent`
          ::: solution show
            content
          :::
      `)
  expect(input).toMatchSnapshot()
})
