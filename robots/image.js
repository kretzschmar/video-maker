import axios from "axios"
import fs from "fs/promises"
import state from "./state.js"

export default (async () => {
 
    console.log('> [image-robot] Starting...')
   
    const config = await ReadPexelConfigFile();
    
    const { API_KEY,  URL_PEXEL } = config;

    async function ReadPexelConfigFile() {
      try {
        const data = await fs.readFile('pexel.json', 'utf-8');
        return JSON.parse(data);
      
      } catch (error) {
        console.error('Ocorreu um erro:', error);
      }
    }

    const content = state.load()

     const headers = {
       Authorization: API_KEY
     }; 

     console.log(content.searchTerm);

     const params = {
       query: content.searchTerm,
       per_page: 5
     };
    
     const response = await axios.get(URL_PEXEL, { params, headers });
  
     console.log('Dados da API do Pexels:', response.data);
     // Aqui você pode manipular os dados conforme necessário    
    
    // state.save(content)
    
    // console.log(content)
})