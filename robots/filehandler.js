import fs from 'fs/promises'
import { createWriteStream } from 'fs'
import http from './httphandler.js'

async function readConfigFile(fileName) {
    try {
        let data = await fs.readFile(fileName, 'utf-8');
        return JSON.parse(data);

    } catch (error) {
        console.error('Ocorreu um erro:', error);
    }
}

async function saveFile(fileExtetion, fileName, content) {
    
    try {
      await fs.writeFile(`${fileName}.${fileExtetion}`, content);
      console.log('File saved successfully !');
    } catch (error) {
      console.error('Error fetching or saving file:', error);
    }
  }  


async function saveFileFromHttp(fileExtetion, fileName, urlPhoto) {
    let file;
    try {
        try {

            file = createWriteStream(`${fileName}.${fileExtetion}`);
        
            let response = await http.fetchUrlData(urlPhoto);
            
            await new Promise((resolve, reject) => {
                response.body.pipe(file);
                file.on('finish', resolve);
                file.on('error', reject);
            });

            console.log('File saved successfully');
        } catch (error) {
            console.error('Error fetching or saving file:', error);
        }
    } finally {
        file?.close();
    }
}

export default { readConfigFile, saveFile, saveFileFromHttp }
