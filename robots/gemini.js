import axios from "axios"
import fs from "fs/promises"
import readline from "readline-sync"

export default (async () => {
  console.log('> [gemini-robot] Starting...');

  const searchTerm =  GetSearchTerm();
    
  const config = await ReadConfigFile("gemini.json");
  
  GetDescriptionInformation(config,searchTerm);

  function GetSearchTerm() {
      return readline.question('Type the video description: ')
  }  
    
  async function ReadConfigFile(fileName) {
      try {
        const data = await fs.readFile(fileName, 'utf-8');
        return JSON.parse(data);
    
      } catch (error) {
        console.error('Ocorreu um erro:', error);
     }
  }

  async function GetDescriptionInformation(config, searchTerm) {

      let result = true;
     
      const { API_KEY, URL_PROVIDER } = config;
        
      const params =  {
           key: API_KEY 
      }
    
     
      if(params.key == null || params.key == "" || params.key == undefined)
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
        const response = await axios.post(URL_PROVIDER, body, { params });
        let data = parseData(response.data);
        console.log(data.candidates[0].content.parts[0].text);
     }
     catch (error) {
       result = false;
       return result;
     }
    
    return result;
  }
  
  function parseData(data) {
    if (!data) return {};
    if (typeof data === 'object') return data;
    if (typeof data === 'string') return JSON.parse(data);
    return {};
  }

});
