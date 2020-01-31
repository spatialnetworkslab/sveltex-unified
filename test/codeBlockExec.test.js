
import dedent from 'dedent'
import { processor } from '../src/index.js'

const process = async (md) => {
  const result = await processor()
    .process(md)
  return result.toString()
}

test('process js exec code block and normal script block', async () => {
  const input = await process(dedent`
        <script>
            let d = 'e'
        </script>
        \`\`\`js exec
        let a = 'b'
        let c = 1
        \`\`\`
        
        { a }
    `)
  expect(input).toMatchSnapshot()
})

test('process js exec echo code block', async () => {
  const input = await process(dedent`
          \`\`\`js exec echo
          let a = 'b'
          let c = 1
          \`\`\`
          
          { a }
      `)
  expect(input).toMatchSnapshot()
})

test('process multiple js exec code blocks', async () => {
  const input = await process(dedent`
            \`\`\`js exec
            let a = 'b'
            let c = 1
            \`\`\`
            
            { a }

            \`\`\`js exec
            let d = 'b'
            let e = 1
            \`\`\`
        `)
  expect(input).toMatchSnapshot()
})

test('process js module code block', async () => {
  const input = await process(dedent`
            <script context="module">
                let d = 'e'
            </script>
            \`\`\`js module
            let x = 'b'
            let y = 1
            \`\`\`
            
            { a }
        `)
  expect(input).toMatchSnapshot()
})

test('process html exec echo code block', async () => {
  const input = await process(dedent`
          \`\`\`html exec echo
          <p>test</p>
          \`\`\`
      `)
  expect(input).toMatchSnapshot()
})
