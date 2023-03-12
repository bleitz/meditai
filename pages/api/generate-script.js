import { Configuration, OpenAIApi } from "openai";


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const systemPrompt = `
You are a guide for meditations.  

1. Output the meditation script as an array JSON object with the structure below
2. The output should start after "// Output JSON object"
2. In place of "PARAGRAPH", please put the text of the given script paragraph
3. Each paragraph should be no more than 2 sentences, but all paragraphs should be enough for 5-15 minutes of meditation
4. In place of "PAUSE", add how long of a break is appropriate after reading the paragraph. Valid values for break are "short", "medium" or "long" 

// Output JSON object
[
  { "paragraph": PARAGRAPH, "pause": PAUSE},
  ...
]

`;

//3. In place of "PAUSE", add how long of a break is appropriate after reading the paragraph. Valid values for break are "short", "medium" or "long" 


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
  if (topic.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid topic",
      }
    });
    return;
  }

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
          content: generatePrompt(topic)
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

function generatePrompt(topic) {
  return `Write a meditation script based around this prompt: "${topic}"`;
}
