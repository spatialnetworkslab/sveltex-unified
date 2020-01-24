import { processor } from '../src/index.js'

const parse = processor.processSync
test('process basic markdown correctly', () => {
  expect(parse('# test').toString()).toBe('<h1>test</h1>')
})
