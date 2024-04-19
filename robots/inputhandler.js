import readline from 'readline-sync'

function getSearchInput(message) {
    return readline.question(message)
}

export default { getSearchInput };