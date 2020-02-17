import { parse as tokenizeWords } from 'space-separated-tokens'

export default function csbBlockPlus (node, config) {
  const props = tokenizeWords(config)
  const [location, params, ranges = ''] = props
  node.data.codesandboxplus = {
    tag: 'iframe',
    location,
    params,
    ranges: [].concat(ranges.split(','))
  }
}
