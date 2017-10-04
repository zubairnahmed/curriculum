const marked = require('marked')
const utils = require('./utils')

module.exports = () =>
  utils.readdir('/glossary')
    .then(convertGlossaryFileNamesToTerms)
    .then(loadTermValues)
    .then(loadTermDefinitions)
    .then(utils.indexById)

const convertGlossaryFileNamesToTerms = glossaryFileName =>
  glossaryFileName
    .filter(utils.noExtension)
    .map(fileName => ({
      id: fileName,
      value: fileName.replace(/-/g, ' '),
      path: `/glossary/${fileName}`,
    }))

const loadTermValues = terms =>
  Promise.all(
    terms.map(term =>
      utils.readMarkdownFile(`/glossary/${term.id}/README.md`)
        .then(document => {
          const heading = document.find( token => token.type === 'heading' && token.depth === 1 )
          if (heading)
            term.value = heading.text
          return term
        })
    )
  )

const loadTermDefinitions = terms =>
  Promise.all(
    terms.map(term =>
      utils.readMarkdownFile(`/glossary/${term.id}/README.md`)
        .then(document => {

          const [definitionText, definitionHTML] = getDefinition(document)

          term.definitionText = definitionText
          term.definitionHTML = definitionHTML

          return term
        })
    )
  )

const getDefinition = document => {
  const definitionTextNode = []
  const link = document.links
  definitionTextNode.links = link

  let moveToNext = true

  document.forEach(token => {
    if (token.type === 'heading' && token.text === 'References') moveToNext = false
    if (token.type === 'heading' && token.depth === 1) return
    if (token.type === 'heading' && token.text === 'Definition') return
    if (moveToNext)
      definitionTextNode.push(token)
  })

  const definitionText = []
  definitionTextNode.forEach(textNode => {
    if (!textNode.links)
      definitionText.push(textNode.text)
  })

  return [definitionText.join(' '), marked.parser(definitionTextNode)]
}
