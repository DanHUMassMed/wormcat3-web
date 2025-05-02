import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
const API_TIMEOUT_MS = 15000;

export const apiRequest = async (method, endpoint, data = null) => {
  try {
    let response;
    const url = `${BASE_URL}${endpoint}`;
    const config = {signal: AbortSignal.timeout(API_TIMEOUT_MS) };
    console.log("Calling apiRequest");
    // First, verify if AbortSignal.timeout is supported in your environment
    if (typeof AbortSignal.timeout !== 'function') {
      console.error('AbortSignal.timeout is not supported in this environment');
    } else {
      console.log('AbortSignal.timeout is supported in this environment');
    }
    

    if (method === 'get') {
      response = await axios.get(url, config);
    } else if (method === 'post') {
      response = await axios.post(url, data);
    } else if (method === 'put') {
      response = await axios.put(url, data, config);
    } else if (method === 'delete') {
      response = await axios.delete(url, config);
    } else {
      throw new Error('Unsupported HTTP method');
    }
    console.log("Returning apiRequest");

    //console.log(JSON.stringify(response.data, null, 4));
    return response.data;

  } catch (error) {
    console.log("catch from apiRequest");
    if (error.response) {
      console.error(`HTTP error occurred: ${error.response.status} ${error.response.statusText}`);
      try {
        console.error('Response content:', JSON.stringify(error.response.data, null, 4));
      } catch {
        console.error('Response content:', error.response.data);
      }
    } else {
      console.error('Other error occurred:', error.message);
    }
    throw error;
  } finally {
    console.log("Finally from apiRequest");
  }
};

