import visit from 'unist-util-visit'
import hash from 'object-hash'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import yaml from 'js-yaml'
import fetch from 'node-fetch'

export default function csbUploadPlus () {
  return async function transformer (tree) {
    const nodesToChange = []
    visit(tree, 'codesandboxplus', node => {
      if ('codesandboxplus' in node.data) {
        console.log('I found code sandbox')
        nodesToChange.push({
          node
        })
      }
    })
    for (const { node } of nodesToChange) {
      const { location, style, params, tag } = node.data.codesandboxplus
      let url
      try {
        const file = await fs.readFileSync(location)
        node.children[0].value = file.toString()
        url = await getSandboxURL(location, params)
      } catch (e) {
        console.log('ERROR', e)
      }

      node.children.push({
        type: 'codesandboxplus',
        data: {
          tagName: tag,
          hName: tag,
          hProperties: {
            src: url,
            sandbox:
              'allow-modals allow-forms allow-popups allow-scripts allow-same-origin',
            style: style,
            className: ['csb'],
            title: 'CodeSandbox for ' + location
          }
        }
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
  const metadataPath = path.join(path.dirname(directoryPath), 'metadata.yml')
  let metadata
  console.log('reading metadata', metadataPath)
  if (fs.existsSync(metadataPath)) {
    metadata = yaml.safeLoad(fs.readFileSync(metadataPath, 'utf8'))
    console.log('read metadata', metadata)
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
      console.log('[res]', res)
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
  console.log('[url]', url)
  return url
}
