import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const modulePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(modulePath)
const contentFilePath = path.join(currentDirectory, '..', 'content.json')
const scriptFilePath = './content/after-effects-script.js'

function save(content) {
  const contentString = JSON.stringify(content)
  return fs.writeFileSync(contentFilePath, contentString)
}

function saveScript(content) {
  const contentString = JSON.stringify(content)
  const scriptString = `var content = ${contentString}`
  return fs.writeFileSync(scriptFilePath, scriptString)
}

function load() {
  const fileBuffer = fs.readFileSync(contentFilePath, 'utf-8')
  const contentJson = JSON.parse(fileBuffer)
  return contentJson
}

export default { 
  save, 
  load, 
  saveScript 
}