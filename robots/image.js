import input from './inputhandler.js'
import file from './filehandler.js'
import http from './httphandler.js'

export default (async () => {

  console.log('> [image-robot] Starting...')

  let searchPicture = input.getSearchInput('Type a photo description: ');

  let config = await file.readConfigFile('pexel.json');

  const resultGetPexelPictureWorks = await getPictureInformation(config, searchPicture, 'Pexel');

  if (!resultGetPexelPictureWorks) {
    config = await file.readConfigFile('unsplash.json');
    await getPictureInformation(config, searchPicture, 'Unsplash');
  }

  async function getPictureInformation(config, searchPicture, providerName) {

    let result = true;
    const { API_KEY, URL_PROVIDER } = config;

    const headers = getHeaderInformation(API_KEY, providerName);

    if (headers.Authorization == null || headers.Authorization == "")
      throw new Error('Header nor defied')

    const params = {
      query: searchPicture,
      per_page: 1
    };

    try {
      let data = await http.getData(URL_PROVIDER, params, headers);
      switch (providerName) {
        case 'Pexel':
          await savePexelFilePictureInformation(data, searchPicture);
          break;
        case 'Unsplash':
          await saveUnsplashFilePictureInformation(data, searchPicture);
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

  async function savePexelFilePictureInformation(data, searchPicture) {
    if (data.photos != undefined && data.photos.length) {
      let urlOjbect = data.photos.find(x => x !== undefined);
      if (urlOjbect != null) {
        let urlPhoto = urlOjbect.src.tiny;
        await file.saveFileFromHttp('jpg',searchPicture, urlPhoto);
      }
    }
  }

  async function saveUnsplashFilePictureInformation(data, searchPicture) {
    if (data.results != undefined && data.results.length) {
      let urlOjbect = data.results.find(x => x !== undefined);
      if (urlOjbect != null) {
        let urlPhoto = urlOjbect.urls.thumb;
        await file.saveFileFromHttp('jpg',searchPicture, urlPhoto);
      }
    }
  }

  function getHeaderInformation(API_KEY, providerName) {
    switch (providerName) {
      case 'Pexel':
        return {
          Authorization: API_KEY
        };
      case 'Unsplash':
        return {
          Authorization: `Client-ID ${API_KEY}`
        }
      default:
        return {
          Authorization: ""
        }
    }
  }
});

