import axios from "axios"
import fetch from 'node-fetch';
import { createWriteStream } from "fs"
import fs from "fs/promises"
import readline from "readline-sync"

export default (async () => {

  console.log('> [image-robot] Starting...')

  const searchPicture = askAndReturnSearchImage()

  let config = await ReadConfigFile("pexel.json");
  
  const resultGetPexelPictureWorks = await GetPictureInformation(config, searchPicture,"Pexel");
   console.log(resultGetPexelPictureWorks);
  if(!resultGetPexelPictureWorks){
    config = await ReadConfigFile("unsplash.json");
    await GetPictureInformation(config, searchPicture,"Unsplash");
  }

  function askAndReturnSearchImage() {
    return readline.question('Type a photo description: ')
  }

  async function ReadConfigFile(fileName) {
    try {
      const data = await fs.readFile(fileName, 'utf-8');
      return JSON.parse(data);

    } catch (error) {
      console.error('Ocorreu um erro:', error);
    }
  }

  async function GetPictureInformation(config, searchPicture, providerName) {

    let result = true;
    const { API_KEY, URL_PROVIDER } = config;
    
    //To do Criar uma função para monstar o header de acordo com o provider
    const headers = {
      Authorization: API_KEY
    };

    const params = {
      query: searchPicture,
      per_page: 1
    };

    try {
      const response = await axios.get(URL_PROVIDER, { params, headers });
      let data = parseData(response.data);
      switch(providerName){
        case "Pexel":
          await SavePexelFilePictureInformation(data, searchPicture);
        break;
        case "Unsplash":
          console.log("ainnnnnnnnnnnnnnnnnnnnn");
         break;
         default:
          result = false;
      }
    }
    catch (error) {
      result = false;
      return result;
    }

    return result;
  }

  async function SavePexelFilePictureInformation(data) {
    if (data.photos != undefined && data.photos.length) {
      let urlPhoto = data.photos.find(x => x !== undefined);
      console.log(urlPhoto.src.tiny);

      let file;
      try {
        file = createWriteStream(`${searchPicture}.jpg`);
        try {
          const response = await fetch(urlPhoto.src.tiny);

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          await new Promise((resolve, reject) => {
            response.body.pipe(file);
            file.on('finish', resolve);
            file.on('error', reject);
          });

          console.log(`File saved successfully`);
        } catch (error) {
          console.error('Error fetching or saving file:', error);
        }
      } finally {
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
});