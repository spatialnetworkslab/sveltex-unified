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
      let fileContents = ''
      try {
        const dir = location
        // cache sandboxId for use as tag name later
        const { url, sandboxId } = await getSandboxURL(dir)
        sandboxUrl = url
        // svelte component is valid only first letter in tag name is capitalied
        componentTagName += sandboxId.toUpperCase()
        // read the file
        const file = await fs.readFileSync(dir)
        // setting code block value to the file string
        fileContents = file.toString()
        // splitting to get all lines in array
        const lines = fileContents.split('\n')

        const parsedRange = new MultiRange(range)
        if (
          parsedRange.min() > lines.length ||
          parsedRange.max() > lines.length
        ) {
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
        <div class="csbp-container">
            <div class="csbp-rendered">
                <!-- svelte component here -->
            </div>
            <div class="csbp-code-tabs">
              <div class="tab">
                <input type="radio" id="tab-1" name="tab-group-1" checked>
                <label for="tab-1">Full code</label>
                <div class="csbp-full-code">
                  <!-- full contents of App.svelte -->
                </div>
              </div>
              <div class="tab">
                <input type="radio" id="tab-2" name="tab-group-1">
                <label for="tab-2">Snippet</label>
                <div class="csbp-code-highlight">
                    <!-- highlighted contents of App.svelte -->
                </div>
              </div>
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
            className: [componentTagName + '-code', 'csbp-content', 'csbp-code']
          }
        },
        children: [
          {
            type: 'code',
            lang: 'svelte',
            meta: null,
            value: fileContents
          }
        ]
      }
      const codeSnippetSection = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [
              componentTagName + '-code-snippets',
              'csbp-content',
              'csbp-code-snippets'
            ]
          }
        },
        children: [
          {
            type: 'code',
            lang: 'svelte',
            meta: null,
            value: snippet.join('\n')
          }
        ]
      }

      // <div class="csbp-tab">
      //   <input type="radio" id="tab-1" name="tab-group-1" checked>
      //     <label for="tab-1">Full code</label>
      //     <div class="csbp-code-snippets">
      //       <!-- full contents of App.svelte -->
      //             </div>
      //           </div>
      const fullCodeTab = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [
              componentTagName + '-fullcode-tab',
              'csbp-tab',
              'csbp-fullcode-tab'
            ]
          }
        },
        children: [
          {
            type: 'element',
            data: {
              hName: 'input',
              hProperties: {
                type: 'radio',
                id: 'tab-1-' + componentTagName,
                name: 'tab-group-' + componentTagName,
                checked: true
              }
            }
          },
          {
            type: 'element',
            data: {
              hName: 'label',
              hProperties: {
                for: 'tab-1-' + componentTagName
              }
            },
            children: [
              {
                type: 'element',
                value: 'Code'
              }
            ]
          },
          codeSection
        ]
      }

      const snippetTab = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [
              componentTagName + '-snippet-tab',
              'csbp-tab',
              'csbp-snippet-tab'
            ]
          }
        },
        children: [
          {
            type: 'element',
            data: {
              hName: 'input',
              hProperties: {
                type: 'radio',
                id: 'tab-2-' + componentTagName,
                name: 'tab-group-' + componentTagName
              }
            }
          },
          {
            type: 'label',
            data: {
              hName: 'label',
              hProperties: {
                for: 'tab-2-' + componentTagName
              }
            },
            children: [
              {
                type: 'element',
                value: 'Key snippets'
              }
            ]
          },
          codeSnippetSection
        ]
      }
      const renderedSection = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [componentTagName + '-rendered', 'csbp-rendered']
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
            className: [
              componentTagName + '-csb-link',
              'csbp-tab',
              'csbp-csb-link'
            ]
          }
        },
        children: [
          {
            type: 'element',
            data: {
              tagName: 'a',
              hName: 'a',
              hProperties: {
                href: sandboxUrl,
                rel: 'noopener noreferrer',
                target: '_blank'
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
      const csbpCodeTabs = {
        type: 'element',
        data: {
          hName: 'div',
          hProperties: {
            className: [componentTagName + '-code-tabs', 'csbp-code-tabs']
          }
        },
        children: [fullCodeTab, snippetTab, sandboxUrlSection]
      }
      // artificially create a code exec block
      const importRenderingExample = {
        type: 'code',
        lang: 'js',
        meta: 'exec',
        value: `import ${componentTagName} from '${path.resolve(location)}'`
      }
      const sectionsInOrder = [
        importRenderingExample,
        renderedSection,
        csbpCodeTabs
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
  // console.log('Writing to', directoryPath)
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
