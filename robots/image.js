import axios from "axios"
import fetch from 'node-fetch';
import {createWriteStream} from "fs"
import fs from "fs/promises"
import readline from "readline-sync"
import state from "./state.js"

export default (async () => {
 
    console.log('> [image-robot] Starting...')
   
    const config = await ReadPexelConfigFile();

    const searchPicture =  askAndReturnSearchImage()
    
    console.log(searchPicture);
    
    await GetPexelPictureInformation(config,searchPicture);
    
    function askAndReturnSearchImage() {
      return readline.question('Type a photo description: ')
    }

    async function ReadPexelConfigFile() {
      try {
        const data = await fs.readFile('pexel.json', 'utf-8');
        return JSON.parse(data);
      
      } catch (error) {
        console.error('Ocorreu um erro:', error);
      }
    }

    async function GetPexelPictureInformation(config, searchPicture){
  
      const { API_KEY,  URL_PEXEL } = config;
     
       const headers = {
         Authorization: API_KEY
       }; 
  
       const params = {
         query: searchPicture,
         per_page: 1
       };
      
       const response = await axios.get(URL_PEXEL, { params, headers });
  
       let data = parseData(response.data);

       if (data.photos != undefined && data.photos.length)
       {
          let urlPhoto = data.photos.find(x=>x!==undefined);
          console.log(urlPhoto.src.tiny);
         
          let file;
          try{
              file = createWriteStream("example.png");
              try {
                const response = await fetch(urlPhoto.src.tiny);
            
                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }
            
                // Pipe the response body (a readable stream) to the file stream
                await new Promise((resolve, reject) => {
                  response.body.pipe(file);
                  file.on('finish', resolve);
                  file.on('error', reject);
                });
            
                console.log(`File saved successfully`);
              } catch (error) {
                console.error('Error fetching or saving file:', error);
              }
         } finally{
          file?.close();
        }
      }
    }

    function parseData(data) {
      if (!data) return {};
      if (typeof data === 'object') return data;
      if (typeof data === 'string') return JSON.parse(data);
  
      return {};
  }

   // Aqui você pode manipular os dados conforme necessário    
   //const content = state.load()
  // state.save(content)
    
  // console.log(content)
});


//Edy
// ,;;;;;;;;;;;.
// ,;;;;;;;;;`````)
// ,;;;;;;;;'    (@)               ,',
// ;;;;;;;;')       \               ,
// ;;;;;;;;_}       _)            ',
// ;;;;;;'        _;_______________
// `;;;;;        ;_.---------------'
//  `;;;         (
//    `;.        )
