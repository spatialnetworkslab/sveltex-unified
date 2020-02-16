import visit from 'unist-util-visit'
import hash from 'object-hash'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import yaml from 'js-yaml'
import fetch from 'node-fetch'

export default function csbUploadPlus (options) {
  const { rangeLegend } = options
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
      const { location, style, params, tag, ranges } = node.data.codesandboxplus
      let sandboxUrl
      let componentTagName = 'example'
      // placeholder for merging lines
      const mergeLines = []
      try {
        // import path in svelte is different from readFileSync path
        const dir = location.split('../')[location.split('../').length - 1]
        // cache sandboxId for use as tag name later
        const { url, sandboxId } = await getSandboxURL(dir, params)
        sandboxUrl = url
        // svelte component is valid only first letter in tag name is capitalied
        componentTagName = sandboxId.toUpperCase()
        // read the file
        const file = await fs.readFileSync(dir)
        // setting code block value to the file string
        node.children[0].value = file.toString()
        // splitting to get all lines in array
        const lines = node.children[0].value.split('\n')
        // opening script tag
        mergeLines.push('<script>\n')
        // find closing script tag line number
        const closingScriptTagLineNumber = lines.findIndex(
          line => line.trim() === '</script>'
        )
        // script close flag
        let isScriptClosed = false
        // for all range pairs
        ranges.forEach(range => {
          const [beg, end] = range.split('-')
          // if beginning line is more than closing tag line, script close the block before
          if (beg > closingScriptTagLineNumber && !isScriptClosed) {
            isScriptClosed = true
            mergeLines.push('</script>\n')
          }
          if (end) {
            mergeLines.push(
              rangeLegend
                ? rangeLegend(beg, end)
                : `//<!-- line ${beg} to ${end} -->//\n`
            )
            mergeLines.push(...lines.slice(beg - 1, end))
          } else {
            // *** not tested yet ***
            mergeLines.push(
              rangeLegend
                ? rangeLegend(beg, end)
                : `//<!-- line ${beg} to ${end} -->//\n`
            )
            mergeLines.push(lines[beg])
          }
        })
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
        className: [componentTagName + '-container']
      }
      // by default code section appears first in node.children
      const codeSection = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [componentTagName + '-code']
          }
        },
        children: [node.children[0]]
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
            className: [componentTagName + '-csv-link']
          }
        },
        children: [
          {
            type: 'element',
            data: {
              tagName: 'a',
              hName: 'a',
              hProperties: {
                src: sandboxUrl
              }
            }
          }
        ]
      }
      const sectionsInOrder = [renderedSection, codeSection, sandboxUrlSection]
      node.children = sectionsInOrder
      // insert import path to the beginning line of script block
      visit(tree, 'root', node => {
        const [_, theRest] = node.children[0].value.split('<script>')
        node.children[0].value = [
          '<script>',
          ` let ${componentTagName};
            onMount(async () => {
            const module = await import("${location}");
            ${componentTagName} = module.default;
          })`,
          theRest
        ].join('')
      })
    }
    return tree
  }
}

async function getSandboxURL (directory, params) {
  const cwd = process.cwd()
  const directoryPath = path.join(cwd, path.dirname(directory))
  const absolutePath = path.join(directoryPath, '**')
  const fileNames = glob.sync(absolutePath, {
    nodir: true,
    ignore: ['**/node_modules/**', 'metadata.yml']
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
  const metadataPath = path.join(path.dirname(absolutePath), 'metadata.yml')
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
  const url = `https://codesandbox.io/embed/${metadata.sandbox_id}${
    params ? '?' + params : ''
  }`
  return { url, sandboxId: metadata.sandbox_id }
}
