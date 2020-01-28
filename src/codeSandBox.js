import { parse as tokenizeWords } from 'space-separated-tokens'
import hash from 'object-hash'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import yaml from 'js-yaml'
import request from 'sync-request'

export default function codesandbox (node, config, tokenize) {
  const props = tokenizeWords(config)
  const location = props[0]
  const params = props[1]
  let style = props[2]
  if (style === undefined) {
    style = 'width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden'
  }
  if (node.children.length > 0) {
    throw new Error('Codesandbox block should not have any content')
  }
  const url = getSandboxURL(location, params)
  node.data.hName = 'iframe'
  node.data.hProperties = {
    src: url,
    sandbox: 'allow-modals allow-forms allow-popups allow-scripts allow-same-origin',
    style: style
  }
}

function getSandboxURL (directory, params) {
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
    const res = JSON.parse(request('POST', 'https://codesandbox.io/api/v1/sandboxes/define?json=1', {
      json: { files }
    }).getBody('utf8'))
    metadata.sandbox_id = res.sandbox_id
    metadata.hash = filesHash
    fs.writeFileSync(metadataPath, yaml.safeDump(metadata), 'utf8')
  }
  const url = `https://codesandbox.io/embed/${metadata.sandbox_id}${params ? '?' + params : ''}`
  return url
}
