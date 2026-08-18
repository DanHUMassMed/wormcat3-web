import axios from 'axios';

const BASE_URL = process.env.REACT_APP_FASTAPI_BASE_URL;
const API_TIMEOUT_MS = process.env.REACT_APP_FASTAPI_TIMEOUT_MS;

export const apiRequest = async (method, endpoint, data = null, config = null) => {
  try {
    const url = `${BASE_URL}${endpoint}`;
    
    if(!config){
      config = {
        headers: {
          'Content-Type': 'application/json', // I'm sending JSON
          'Accept': 'application/json'        // I expect JSON back
        },
        timeout: API_TIMEOUT_MS
      };
    }

     const methods = {
      get: () => axios.get(url, config),
      post: () => axios.post(url, data, config),
      put: () => axios.put(url, data, config),
      delete: () => axios.delete(url, config),
    };
    
    if (!methods[method]) {
      throw new Error('Unsupported HTTP method');
    }

    const response = await methods[method]();
    return response.data;

    
  } catch (error) {
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
  } 
};

