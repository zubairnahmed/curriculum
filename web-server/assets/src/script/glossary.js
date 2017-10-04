const escapeRegExp = require('escape-string-regexp')
const {loadDigest} = require('./digest')
 
loadDigest().then((digest) => {
  const terms = Object.values(digest.glossary)
  const textNodes = getTextNodesIn('div.markdown-body')
  textNodes.forEach(textNode => {
    if (withinForbiddenParent(textNode)) return
    const text = textNode.textContent
    const matchingTerms = terms.filter(term =>
      text.toLowerCase().includes(term.value.toLowerCase())
    )
    if (matchingTerms.length === 0) return
    const nodes = createLinksForTerms(matchingTerms, text)
    $(textNode).replaceWith(nodes)
  })
})
.catch(error => {
  if (error.message.includes('digest')) return
  throw error
})
 
const withinForbiddenParent = node =>
  $(node).parents('h1,h2,h3,h4,a[href],button,textarea,code,pre').length > 0
 
const getTextNodesIn = node =>
  $(node)
    .find(":not(iframe)")
    .addBack()
    .contents()
    .filter(function(){
      return this.nodeType == 3
    })
    .get()
 
 
const createLinksForTerms = (terms, text) =>
  terms.reduce((nodes, term) => {
    const newNodes = []
    nodes.forEach(node => {
      if (typeof node !== 'string'){
        newNodes.push(node)
        return
      }
      newNodes.push(...replaceTermWithLink(term, node))
    })
    return newNodes
  }, [text])
 
const replaceTermWithLink = (term, string) => {
  const newNodes = []
  const regExp = new RegExp(`(${escapeRegExp(term.value)})`, 'ig')
  let match, numberOfMatches = 0
  while((match = regExp.exec(string)) !== null){
    regExp.lastIndex = 0
    numberOfMatches++
    newNodes.push(string.slice(0, match.index))
    newNodes.push(termToLink(term).text(match[0]))
    string = string.slice(match.index+term.value.length)
  }
  if (numberOfMatches === 0) return [string]
  newNodes.push(string)
  return newNodes
}
 
const termToLink = term =>
  $('<a>')
    .attr('href', term.path)
    .attr('title', `${term.value}: ${term.definitionText}`)
    .addClass('glossary-term-link')
