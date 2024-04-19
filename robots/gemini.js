import input from './inputhandler.js'
import file from './filehandler.js'
import http from './httphandler.js'

export default (async () => {
  console.log('> [gemini-robot] Starting...');

  let searchTerm = input.getSearchInput('Type a serch term: ');

  let config = await file.readConfigFile('gemini.json');

  getDescriptionInformation(config, searchTerm);

  async function getDescriptionInformation(config, searchTerm) {

    let result = true;

    const { API_KEY, URL_PROVIDER } = config;

    const params = {
      key: API_KEY
    }

    if (params.key == null || params.key == "" || params.key == undefined)
      throw new Error('Header nor defied')

    const body = {
      contents: [
        {
          parts: [
            {
              text: searchTerm
            }
          ]
        }
      ]
    };

    try {
      let data = await http.postData(URL_PROVIDER, body, params);
      await file.saveFile('txt',searchTerm, data.candidates[0].content.parts[0].text);
    }
    catch (error) {
      result = false;
      return result;
    }
    return result;
  }
});
