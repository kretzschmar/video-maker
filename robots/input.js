import readline from 'readline-sync'
import state from './state.js'
import input from './inputhandler.js'

export default (async () => {
  const content = {
    maximumSentences: 10
  }
  
  content.searchTerm = input.getSearchInput('Type a Wikipedia search term: '); 
  content.prefix = askAndReturnPrefix()
  state.save(content)

  function askAndReturnPrefix() {
    const prefixes = ['Who is', 'What is', 'The history of']
    const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
    const selectedPrefixText = prefixes[selectedPrefixIndex]

    return selectedPrefixText
  }
})