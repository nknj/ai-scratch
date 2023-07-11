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

// Create the Express app
var app = express();

// setup up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// "database"
const messages = [{"role": "system", "content": "You are a helpful assistant."}]

// Set up marked for markdown
import { marked } from 'marked';
app.locals.marked = marked;

// Routes
app.get('/', function(req, res) {
    res.render('response-sse', { messages: messages, responseData: {'no request yet': 'no response yet' }});
});

let openaiStreamResponse;
let openaiLatestResponse = '';

app.post('/submit', async (req, res) => {
    const prompt = {role: "user", content: req.body.inputData};
    messages.push(prompt);

    openaiStreamResponse = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        stream: true
      }, {responseType: 'stream'});
    
    res.end();
});

app.get('/stream', async (req, res) => {
    if (openaiStreamResponse && openaiStreamResponse.headers['content-type'].includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        openaiStreamResponse.data
            .on('data', chunk => {
                const payloads = chunk.toString().split("\n\n");
                for (const payload of payloads) {
                        if (payload.includes('[DONE]')) {
                            return;
                        }
                        if (payload.startsWith("data:")) {
                            const data = JSON.parse(payload.replace("data: ", ""));
                            try {
                                const chunk = data.choices[0].delta?.content;
                                if (chunk) {
                                    openaiLatestResponse += chunk;
                                }
                            } catch (error) {
                                console.log(`Error with JSON.parse and ${payload}.\n${error}`);
                            }
                        }
                }
                // latestMessage = chunk; // save the chunk of data to latestMessage variable
                res.write(chunk); // send the chunk of data to the client
            })
            .on('end', () => {
                messages.push({role: "assistant", content: openaiLatestResponse});
                openaiLatestResponse = '';
                res.end();
            });
    } else {
        openaiStreamResponse.text().then(text => res.send(text));
    }
});

app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});