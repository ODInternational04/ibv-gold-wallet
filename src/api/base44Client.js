import axios from 'axios';

export const db = { auth: { isAuthenticated: async ()=>false, me: async ()=>null }, entities: new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } }; 

export const base44=db; 

export const createAxiosClient = (config) => {
  const axiosConfig = {
    baseURL: config.baseURL || '',
    headers: config.headers || {}
  };

  if (config.token) {
    axiosConfig.headers['Authorization'] = `Bearer ${config.token}`;
  }

  const client = axios.create(axiosConfig);

  if (config.interceptResponses) {
    client.interceptors.response.use(
      response => response.data,
      error => Promise.reject(error)
    );
  }

  return client;
};

export default db;