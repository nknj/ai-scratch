import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

var app = express();

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // Set the path to your views directory

const messages = [{"role": "system", "content": "You are a helpful assistant."}]

import { marked } from 'marked';
app.locals.marked = marked;

// Routes
app.get('/', function(req, res) {
    res.render('response', { messages: messages, responseData: {'no request yet': 'no response yet' }});
});

app.post('/submit', async (req, res) => {
    const prompt = {role: "user", content: req.body.inputData};
    messages.push(prompt);

    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages
      });
    
    response.data.choices.forEach(choice => {
        messages.push(choice.message)
    });
    res.render('response', { messages: messages, responseData: response.data });
});

app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});