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
