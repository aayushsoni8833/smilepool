import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nearService from './nearService.js';

console.log('✅ All server.js imports successful');
const app = express();
console.log('✅ Express app created');
app.use(cors());
console.log('✅ CORS middleware added');
app.use(express.json());
console.log('✅ JSON middleware added');
