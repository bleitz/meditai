import Head from "next/head";
import { useState, useRef } from "react";
import styles from "./index.module.css";

import ReactAudioPlayer from "react-audio-player";
import { Text, Textarea, Button, Switch, Radio } from '@nextui-org/react';

import Lottie from "lottie-react";
import loadingAnimation from "../public/circle-animation.json";

export default function Home() {
  const [topicInput, setTopicInput] = useState("");
  const [audioSrc, setAudioSrc] = useState('');
  const [duration, setDuration] = useState("5");
  const [loading, setLoading] = useState(false);

  
  async function onSubmit(event) {

    setLoading(true);

    try {

      // Get raw chatGPT script
      const scriptString = await getScript(topicInput);
      console.log(scriptString)

      // Get timed audio
      const blob = await getAudio(scriptString, duration);
      setAudioSrc(URL.createObjectURL(blob));
      setTopicInput("");
      setLoading(false);

    } catch(error) {

      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  async function getScript(topicInput) {
    
    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topicInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      return data.result;

    } catch(error) {

      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  async function getAudio(scriptString, duration) {
  
    try {
      const response = await fetch(`/api/generate-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          },
          body: JSON.stringify({ scriptString, duration }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to call endpoint');
      }

      return await response.blob();
    
    }
    catch (error) {
      console.log(error)
      alert(error.message);
    }  
  }  

  return (
    <div>
      <Head>
        <title>mindGPT - 100% AI geer</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <Text h2>How can I guide your meditation?</Text>
        <Text style={{ "margin": "24px 0"}}>Do you want to cultivate a feeling & thought? Contemplate a topic? Manifest or internalise an idea?</Text>

        <div style={{ "marginBottom": "40px"}}>
          <Textarea
            placeholder="e.g. I want to cultivate more positivity towards my future"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            fullWidth={true}
          />

          <Radio.Group  
            orientation="horizontal" 
            label="Time" 
            defaultValue="5" 
            value={duration} 
            onChange={setDuration}
            style={{ "margin": "24px 0"}}
          >
            <Radio value="5">
              5 min
            </Radio>
            <Radio value="10">
              10 min
            </Radio>
            <Radio value="15">
              15 min
            </Radio>
          </Radio.Group>
        </div>

        <div style={{ "margin": "24px 0"}}>
          {
            audioSrc ? <ReactAudioPlayer src={audioSrc} autoplay controls /> 
            :
              (loading ? <Lottie style={{ "width": "100px" }} animationData={loadingAnimation} loop={true} />
              :
              <Button onPress={onSubmit}>Generate your meditation</Button>)
          }
        </div>
{/*         <div className="music" style={{"display": "flex"}}>
          <Switch 
            checked={true}
            size="sm" 
          />
          <Text style={{ "margin": "0 8px"}}>Music</Text>
        </div> */}
        
      </main>
    </div>
  );
}
