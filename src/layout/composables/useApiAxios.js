import axios from 'axios';

const BASE_URL = 'https://10.235.119.7:8002';

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // httpsAgent: new https.Agent({
  //   rejectUnauthorized: false // THIS IS THE IMPORTANT LINE
  // })
});

export default instance;
