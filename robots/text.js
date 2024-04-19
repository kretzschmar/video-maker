
import sentenceBoundaryDetection from 'sbd'
import state from './state.js'
import getFromWikipedia from './wikipedia.js'
import keywordExtractor from 'keyword-extractor';

export default (async () => {
  console.log('> [text-robot] Starting...')
  const content = state.load()

  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)
  limitMaximumSentences(content)
  
  state.save(content)

  async function fetchContentFromWikipedia(content) {
    console.log('> [text-robot] Fetching content from Wikipedia')   
    content.sourceContentOriginal = await getFromWikipedia(content.searchTerm)
    console.log('> [text-robot] Fetching done!')
  }  

  function sanitizeContent(content) {
    const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal.content)
    const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
    content.sourceContentSanitized = withoutDatesInParentheses    
  }  

  function removeBlankLinesAndMarkdown(text) {
    console.log(text);
    const allLines = text.split('\n')

    const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
      if (line.trim().length === 0 || line.trim().startsWith('=')) {
        return false
      }
      return true
    })

    return withoutBlankLinesAndMarkdown.join(' ')
  }

  function removeDatesInParentheses(text) {
    return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
  }

  function breakContentIntoSentences(content) {
    content.sentences = []

    const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
    sentences.forEach((sentence) => {
      
      content.sentences.push({
        text: sentence,
        keywords: getKeyWords(sentence),
      })
    });  
  }

  function getKeyWords(sentence){
    return keywordExtractor.extract(sentence,{
      language:"english",
      remove_digits: true,
      return_changed_case:true,
      remove_duplicates: true
    }).slice(0,2);
  }

  function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences)
  }
})