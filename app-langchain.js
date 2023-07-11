import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
const chat = new ChatOpenAI({ temperature: 0 });

var app = express();

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // Set the path to your views directory

const messages = [{"role": "system", "content": "You are a helpful assistant that translates English to French."}]

import { marked } from 'marked';
app.locals.marked = marked;

// Routes
app.get('/', function(req, res) {
    res.render('response-langchain', { messages: messages, responseData: {'no request yet': 'no response yet' }});
});

app.post('/submit', async (req, res) => {
    const prompt = {role: "user", content: req.body.inputData};
    messages.push(prompt);

    const response = await chat.call([
        new SystemMessage(messages[0].content),
        new HumanMessage(req.body.inputData),
      ]);

    messages.push({role: "system", content: response.content})
    res.render('response-langchain', { messages: messages, responseData: response });
});

app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});