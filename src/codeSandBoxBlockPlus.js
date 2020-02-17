import { parse as tokenizeWords } from 'space-separated-tokens'

export default function csbBlockPlus (node, config) {
  const props = tokenizeWords(config)
  const [location, ranges = ''] = props
  node.data.codesandboxplus = {
    tag: 'iframe',
    location,
    ranges: [].concat(ranges.split(','))
  }
}
