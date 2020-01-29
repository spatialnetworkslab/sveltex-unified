import visit from 'unist-util-visit'
import hash from 'object-hash'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import yaml from 'js-yaml'
import fetch from 'node-fetch'

export default function csbUpload () {
  return async function transformer (tree) {
    const nodesToChange = []
    visit(tree, 'codesandbox', node => {
      if ('codesandbox' in node.data) {
        nodesToChange.push({
          node
        })
      }
    })
    for (const { node } of nodesToChange) {
      const location = node.data.codesandbox.location
      const style = node.data.codesandbox.style
      const params = node.data.codesandbox.params
      try {
        const url = await getSandboxURL(location, params)
        node.data.hName = 'iframe'
        node.data.hProperties = {
          src: url,
          sandbox: 'allow-modals allow-forms allow-popups allow-scripts allow-same-origin',
          style: style
        }
      } catch (e) {
        console.log('ERROR', e)
      }
    }
    return tree
  }
}

async function getSandboxURL (directory, params) {
  const cwd = process.cwd()
  const directoryPath = path.join(cwd, directory)
  const absolutePath = path.join(directoryPath, '**')
  const fileNames = glob.sync(absolutePath, { nodir: true, ignore: ['**/node_modules/**', '.metadata'] }) // ignore node_modules
  const files = {}
  for (let index = 0; index < fileNames.length; index++) {
    const fileName = fileNames[index]
    files[path.relative(directoryPath, fileName)] = { content: fs.readFileSync(fileName, 'utf-8') }
  }
  const filesHash = hash(files)
  const metadataPath = path.join(directoryPath, '.metadata')
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
      res = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
        method: 'post',
        body: JSON.stringify({ files: files }),
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
    } catch (err) {
      console.log(err, 'error')
    }
    metadata.sandbox_id = res.sandbox_id
    metadata.hash = filesHash
    fs.writeFileSync(metadataPath, yaml.safeDump(metadata), 'utf8')
  }
  const url = `https://codesandbox.io/embed/${metadata.sandbox_id}${params ? '?' + params : ''}`
  return url
}
