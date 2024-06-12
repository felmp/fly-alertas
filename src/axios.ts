import axios from "axios";
require('dotenv').config();

axios.defaults.headers.post["Content-Type"] = "application/json";

const gpt = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.OPEN_AI_KEY
  },
  baseURL: 'https://api.openai.com/v1/'
});

const wpp = axios.create({
  headers: {
    'X-User-API-Key': process.env.WPP_API_KEY,
    'Content-Type': 'application/json'
  },
  baseURL: 'https://api.p.2chat.io/'
});

const engine_v1 = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Partner-Authorization': process.env.ENGINE_V1_API_KEY
  },
  baseURL: 'https://seats.aero/partnerapi/'
})

export {
  gpt,
  wpp
};