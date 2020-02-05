
import dedent from 'dedent'
import { processor } from '../src/index.js'

const process = async (md) => {
  const result = await processor()
    .process(md)
  return result.toString()
}

test('process solution block', async () => {
  const input = await process(dedent`
          ::: solution show
            content
          :::
      `)
  expect(input).toMatchSnapshot()
})

test('process nested solution block', async () => {
  const input = await process(dedent`
::: solution show
    ::: codesandbox ./test/codesandbox/ some?props
    :::
:::
        `)
  expect(input).toMatchSnapshot()
})

test('use frontmatter to hide solution', async () => {
  const input = await process(dedent`
---
solution: false
---
::: solution
don't show this
:::
          `)
  expect(input).toMatchSnapshot()
})

test('local show option overrides frontmatter', async () => {
  const input = await process(dedent`
---
solution: false
---
::: solution show
    do show this
:::
            `)
  expect(input).toMatchSnapshot()
})
