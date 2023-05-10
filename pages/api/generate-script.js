import { Configuration, OpenAIApi } from "openai";

// Commented out because I want to first set up the database on the client side - later I will uncomment this and set up the database on the server side
/*
import admin from 'firebase-admin';
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../../serviceAccountKey.json');
if (!firebase.apps.length) {
  firebase.initializeApp({});
}
const app = initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://your-project-id.firebaseio.com',
});
const db = getFirestore(app);
*/

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const systemPrompt = `
    You are a guide for meditations.  

    1. Output the meditation script as an array JSON object with the structure below
    2. The script is structured in "breaks", during which the meditator can focus on the meditation, and "paragraphs", which contain the spoken guided meditation
    3. Valid values for break are "short", "medium", "long" or "none"
    4. A long break should allow the meditator to focus on the main part of the meditation
    5. The last paragraph must have a break of "none"
    6. No matter the language of the prompt, the script should be in English

    // Output JSON object
    [
      { "paragraph": PARAGRAPH, "pause": PAUSE},
      ...
    ]

  `;

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const topic = req.body.topic || '';
  const duration = req.body.duration || 5;
  
  if (topic.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid topic",
      }
    });
    return;
  }

// Commented out because I want to first set up the database on the client side - later I will uncomment this and set up the database on the server side
/*   logPrompt(topic)
  .then(() => console.log("Prompt logged: "+topic))
  .catch((error) => console.error(error)); */

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: generatePrompt(topic, duration)
        },
      ]
    });

    console.log(completion.data.choices[0].message.content)
    res.status(200).json({ result: completion.data.choices[0].message.content });
  } catch(error) {

    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
}

function generatePrompt(topic, duration) {
  return `Write a meditation script based around this prompt: "${topic}". The meditation should be around ${duration} minutes.`;
}

// Commented out because I want to first set up the database on the client side - later I will uncomment this and set up the database on the server side
/* async function logPrompt(prompt) {

  await db.collection("prompts").add({
    prompt: prompt,
    createdAt: new Date().getTime(),
  });
} */
