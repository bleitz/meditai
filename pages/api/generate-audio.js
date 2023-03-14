// creates a temp file on server, the streams to client
/* eslint-disable no-unused-vars */

const { textToSpeech } = require('../../utils/azure-cognitiveservices-speech');
const extract = require('extract-json-from-string');

const generateTimedSSMLString = (scriptString, duration) => {

    // Takes in string of an array with the following structure:
    // [
    // [
    //     { "paragraph": "Hello, my name is Jenny.", "pause": "short" },
    //     { "paragraph": "Hello, my name is Paul.", "pause": "long" },
    //     ...
    // ]
    // ]

    // Extracts the inner array from the string
    const outterArray = extract(scriptString);
    const scriptArray = outterArray[0];

    // Calculates the total number of words in all paragraphs to determine the duration of the spoken text
    let totalWords = 0;
    for (let i = 0; i < scriptArray.length; i++) {
        const paragraph = scriptArray[i].paragraph;
        console.log(paragraph)
        totalWords += paragraph.split(' ').length;
    }

    // Calculate duration of spoken text given the total number of words and a rate of 80 words per minute
    let spokenDuration = Math.round(totalWords / 80 * 60);
    
    // Calculate the total duration of breaks needed to achieve the desired duration
    const desiredDuration = (60 * duration) || 60 * 5; // Convert duration from minutes to seconds
    let breakDuration = desiredDuration - spokenDuration - 5; // Subtract 5 seconds for the initial pause

    console.log("desiredDuration: "+desiredDuration)
    console.log("spokenDuration: "+spokenDuration)
    console.log("breakDuration: "+breakDuration)

    // Count the number of short, medium and long breaks in scriptArray
    let shortBreaks = 0;
    let mediumBreaks = 0;
    let longBreaks = 0;
    for (let i = 0; i < scriptArray.length; i++) {
        if (scriptArray[i].pause === "short") {
            shortBreaks++;
        } else if (scriptArray[i].pause === "medium") {
            mediumBreaks++;
        } else if (scriptArray[i].pause === "long") {
            longBreaks++;
        }
    }

    // If a long break is twice as long as a medium break, and a medium break is twice as long as a short break, then:
    // Calculate required duration of short, medium and long breaks in seconds to achieve desired duration
    const shortBreakDuration = Math.round(breakDuration / (shortBreaks + 2 * mediumBreaks + 4 * longBreaks));
    const mediumBreakDuration = 2 * shortBreakDuration;
    const longBreakDuration = 4 * shortBreakDuration;

    // As the API only allows for breaks of maximum 5 seconds, we need to split breaks into multiple breaks of 5 seconds
    // Calculate the number of 5 second breaks needed for each type of break
    const shortBreaks5s = Math.floor(shortBreakDuration / 5);
    const mediumBreaks5s = Math.floor(mediumBreakDuration / 5);
    const longBreaks5s = Math.floor(longBreakDuration / 5);

    // Generate SSML string
    let ssmlString = `
        <speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
        <voice name="en-US-JennyNeural" style="whispering">
        <mstts:silence type="Sentenceboundary" value="5000ms"/>
        <prosody rate="0.94"><break time="5s"/>`;

    for (let i = 0; i < scriptArray.length; i++) {
        ssmlString += `<p>${scriptArray[i].paragraph}</p>`;
        if (scriptArray[i].pause === "short") {

            // Add shortBreaks5s 5 second breaks
            for (let j = 0; j < shortBreaks5s; j++) {
                ssmlString += `<break time="5s"/>`;
            }
        } else if (scriptArray[i].pause === "medium") {

            // Add mediumBreaks5s 5 second breaks
            for (let j = 0; j < mediumBreaks5s; j++) {
                ssmlString += `<break time="5s"/>`;
            }
        } else if (scriptArray[i].pause === "long") {

            // Add longBreaks5s 5 second breaks
            for (let j = 0; j < longBreaks5s; j++) {
                ssmlString += `<break time="5s"/>`;
            }
        }
    }

    ssmlString += `</prosody></voice></speak>`;

    return ssmlString;
}

export default async function(req, res) {
    
    const { scriptString, duration, file } = req.body;
    if (!scriptString) res.status(404).send('Invalid query string');

    const key = 'faac4ed6b7524f0bb18b292f84238898';
    const region = 'germanywestcentral';

    const timedSSMLScript = generateTimedSSMLString(scriptString, duration);

    // Log final text-to-speech input to console
    console.log(timedSSMLScript)
    
    let fileName = null;
    
    // stream from file or memory
    if (file && file === true) {
        fileName = `./temp/stream-from-file-${timeStamp()}.mp3`;
    }
    
    const audioStream = await textToSpeech(key, region, timedSSMLScript, fileName);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    audioStream.pipe(res);
};
 