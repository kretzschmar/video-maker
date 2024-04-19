import axios from 'axios'
import fetch from 'node-fetch'

async function getData(url, params, headers) {
    try {
        let response = await axios.get(url, { params, headers });
        return parseData(response.data);

    } catch (error) {
        console.error('Ocorreu um erro:', error);
    }
}

async function postData(url, body, params) {
    try {
        let response = await axios.post(url, body, { params });
        return parseData(response.data);

    } catch (error) {
        console.error('Ocorreu um erro:', error);
    }
}

async function fetchUrlData(url) {
    let response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response;
}

function parseData(data) {
    if (!data) return {};
    if (typeof data === 'object') return data;
    if (typeof data === 'string') return JSON.parse(data);
    return {};
}

export default { getData, postData, fetchUrlData }
