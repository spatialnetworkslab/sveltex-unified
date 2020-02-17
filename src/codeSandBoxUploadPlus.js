import visit from 'unist-util-visit'
import hash from 'object-hash'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import yaml from 'js-yaml'
import fetch from 'node-fetch'
import MultiRange from 'multi-integer-range'
export default function csbUploadPlus (options) {
  return async function transformer (tree) {
    const nodesToChange = []
    visit(tree, 'codesandboxplus', node => {
      if ('codesandboxplus' in node.data) {
        nodesToChange.push({
          node
        })
      }
    })
    for (const { node } of nodesToChange) {
      const { location, range } = node.data.codesandboxplus
      let sandboxUrl
      let componentTagName = 'example'
      // placeholder for snippet
      const snippet = []
      try {
        // import path in svelte is different from readFileSync path
        const dir = location.split('../')[location.split('../').length - 1]
        // cache sandboxId for use as tag name later
        const { url, sandboxId } = await getSandboxURL(dir)
        sandboxUrl = url
        // svelte component is valid only first letter in tag name is capitalied
        componentTagName += sandboxId.toUpperCase()
        // read the file
        const file = await fs.readFileSync(dir)
        // setting code block value to the file string
        node.children[0].value = file.toString()
        // splitting to get all lines in array
        const lines = node.children[0].value.split('\n')

        const parsedRange = new MultiRange(range)
        if (parsedRange.min() > lines.length || parsedRange.max() > lines.length) {
          // range extends beyond lines
          return
        }
        let prevLine = parsedRange.min()
        for (const line of parsedRange) {
          if (line - prevLine > 1) {
            snippet.push('\n/* SNIP */\n')
          }
          snippet.push(lines[line - 1])
          prevLine = line
        }
      } catch (e) {
        console.log('ERROR', e)
      }
      /*
        <div class="example-container">
            <div class="example-rendered">
                <!-- svelte component here -->
            </div>

            <div class="example-code">
                <!-- full contents of App.svelte -->
            </div>

            <div class="example-code-highlight">
                <!-- highlighted contents of App.svelte -->
            </div>

            <div class="example-csv-link">
                <a href="link/to/csb">Edit</a>
            </div>
        </div>
      */
      // add wrapper class to root
      node.data.hProperties = {
        className: [componentTagName + '-container', 'csbp-container']
      }
      // by default code section appears first in node.children
      const codeSection = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [componentTagName + '-code', 'csbp-code']
          }
        },
        children: [node.children[0]]
      }
      const codeSnippetSection = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [
              componentTagName + '-code-snippets',
              'csbp-code-snippets'
            ]
          }
        },
        children: [
          {
            type: 'code',
            lang: node.children[0].lang,
            meta: null,
            value: snippet.join('\n')
          }
        ]
      }

      const renderedSection = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [componentTagName + '-rendered']
          }
        },
        children: [
          // insert the imported component after sandbox
          {
            type: 'renderedComponent',
            data: {
              tagName: 'svelte:component',
              hName: 'svelte:component',
              hProperties: {
                this: `{${componentTagName}}`
              }
            }
          }
        ]
      }
      const sandboxUrlSection = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [componentTagName + '-csb-link', 'csbp-csb-link']
          }
        },
        children: [
          {
            type: 'element',
            data: {
              tagName: 'a',
              hName: 'a',
              hProperties: {
                href: sandboxUrl
              }
            },
            children: [
              {
                type: 'span',
                value: 'Edit on CodeSandBox'
              }
            ]
          }
        ]
      }

      // artificially create a code exec block
      const importRenderingExample = {
        type: 'code',
        lang: 'js',
        meta: 'exec',
        value: `import ${componentTagName} from '${location}'`

      }
      const sectionsInOrder = [
        importRenderingExample,
        renderedSection,
        codeSection,
        codeSnippetSection,
        sandboxUrlSection
      ]
      node.children = sectionsInOrder
    }
    return tree
  }
}

async function getSandboxURL (directory) {
  const cwd = process.cwd()
  const directoryPath = path.join(cwd, path.dirname(directory))
  const absolutePath = path.join(directoryPath, '**')
  const fileNames = glob.sync(absolutePath, {
    nodir: true,
    ignore: ['**/node_modules/**', '.metadata']
  }) // ignore node_modules
  const files = {}
  for (let index = 0; index < fileNames.length; index++) {
    const fileName = fileNames[index]
    files[path.relative(directoryPath, fileName)] = {
      content: fs.readFileSync(fileName, 'utf-8')
    }
  }

  const filesHash = hash(files)
  // dump yaml to the folder that the example resides
  const metadataPath = path.join(path.dirname(absolutePath), '.metadata')
  let metadata
  if (fs.existsSync(metadataPath)) {
    metadata = yaml.safeLoad(fs.readFileSync(metadataPath, 'utf8'))
  } else {
    metadata = {
      sandbox_id: '',
      hash: ''
    }
  }

  if (filesHash !== metadata.hash) {
    let res
    try {
      res = await fetch(
        'https://codesandbox.io/api/v1/sandboxes/define?json=1',
        {
          method: 'post',
          body: JSON.stringify({ files: files }),
          headers: { 'Content-Type': 'application/json' }
        }
      ).then(res => res.json())
    } catch (err) {
      console.log(err, 'error')
    }
    metadata.sandbox_id = res.sandbox_id
    metadata.hash = filesHash
    fs.writeFileSync(metadataPath, yaml.safeDump(metadata), 'utf8')
  }
  const url = `https://codesandbox.io/s/${metadata.sandbox_id}`
  return { url, sandboxId: metadata.sandbox_id }
}
