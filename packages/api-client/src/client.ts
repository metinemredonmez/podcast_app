import axios from 'axios';

export const createApiClient = (baseURL: string) =>
  axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });
