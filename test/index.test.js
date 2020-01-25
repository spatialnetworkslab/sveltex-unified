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
