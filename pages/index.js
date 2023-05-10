import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import styles from "./index.module.css";

import ReactAudioPlayer from "react-audio-player";
import { Text, Textarea, Button, Radio, Image, Tooltip, Modal, useModal } from '@nextui-org/react';

import Lottie from "lottie-react";
import loadingAnimation from "../public/circle-animation.json";

import { initializeApp } from "firebase/app";
import { getFirestore, updateDoc, addDoc, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [topicInput, setTopicInput] = useState("");
  const [audioSrc, setAudioSrc] = useState('');
  const [duration, setDuration] = useState("5");
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);

  const { setVisible, bindings } = useModal();

  const musicRef = useRef(null);
  const audioRef = useRef(null);
  const inputRef = useRef(null);

  const togglePlay = () => {
    const music = musicRef.current;
    const audio = audioRef.current;
    if (isPlaying) {
      music.pause();
      audio.pause();
    } else {
      music.play();
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };  

  const handleVolumeChange = (e) => {
    const music = musicRef.current;
    music.volume = e.target.value;
    setVolume(e.target.value);
  };

  useEffect(() => {
    musicRef.current.volume = volume;
  }, [volume]);

  const handleInputChange = (e) => {
    setTopicInput(e.target.value);
    const cursorPosition = inputRef.current.selectionStart;
    console.log(cursorPosition);
  }
  
  
  async function onSubmit(event) {

    setLoading(true);

    try {

      // Log prompt to Firebase
      const promptDocRef = await addDoc(collection(db, "prompts"), {
        prompt: topicInput,
        duration: duration,
        timestamp: new Date(),
        promptURL: window.location.href
      });      

      // Get raw chatGPT script
      const scriptString = await getScript(topicInput);

      // Log script to Firebase
      try {
        await updateDoc(promptDocRef, {
          script: scriptString
        }); 
      } catch (error) {
        console.error("Error updating document: ", error);
      }

      // Get timed audio
      const blob = await getAudio(scriptString, duration);
      setAudioSrc(URL.createObjectURL(blob));

/* 
      // Set a timer to simulate the async operations when testing the UI locally
      const blob = await setTimeout(() => {
        setAudioSrc("blah");
        setLoading(false);
      }, 3000); 
       */

      setLoading(false);

    } catch(error) {

      // Consider implementing your own error handling logic here
      console.error(error);
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
        <title>meditai - Personalized, automated guided meditations</title>
        <link rel="icon" href="/logo-noname.png" />
      </Head>

      <main className={styles.main}>
        <button onClick={togglePlay}>Toggle Play</button>
        <audio loop src="music.mp3" ref={musicRef} controls></audio>

        <div style={{ "margin": "16px 0 48px", "display": "flex", "flexDirection": "column", "alignItems": "center" }}>
          <div style={{ "margin": "40px" }}>
            <Image
              width={150}
              height={150}  
              src="logo-noname.png"
              alt="Logo"
              objectFit="cover"
            />
          </div>

          <Text h2>Your AI meditation guide</Text>
          <Text>I am here to help, whether you want to cultivate a specific feeling or internalize a thought. Let me know what you're looking for, and I'll guide you through your meditation.</Text>
          
          <div>
            <div style={{"display": "flex"}}>
              <Button auto light color="primary" onPress={() => setVisible(true)} aria-label="learn-more">
                Learn more
              </Button>
              <Button auto light color="primary" aria-label="feedback">
                  <a target="_blank"  href="https://docs.google.com/forms/d/e/1FAIpQLScxg0Vm0aVm7pn3ln-5DDwHplFH6lMP1i_DfasL4BzZbRFLNA/viewform?usp=sf_link" rel="noopener noreferrer">
                  Feedback
                  </a>
              </Button>
            </div>

            <Modal
              scroll
              width="600px"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
              {...bindings}
            >
              <Modal.Header>
                <Text h2 id="modal-title" size={18}>
                  About this tool
                </Text>
              </Modal.Header>

              <Modal.Body>
                <Text h4>What this tool is</Text>
                <Text>It automatically creates personalized, guided meditations. Use it to explore specific thoughts and feelings, for guidance or to bring more intent to your everyday life.</Text>
                <Text>Topics to inspire : "I feel anxious about ... ", "I want to be more grateful about ...", "I realised ... . I want to internalize this realisation.", "Today, I get to do ... . I want to appreciate that with more intent." </Text>
                <Text>Know someone who might like this? Share it with them!</Text>
                <Text>Questions? Ask them: <a href="mailto:benni_leitz@hotmail.com" rel="noopener noreferrer">benni_leitz@hotmail.com</a></Text>
                <Text>The meditation script is genererated by OpenAI's GPT API. The audio is generated by Azure's Text-to-Speech API. Music by Andrewkn. Loading animation by Wan Souza.</Text>
                
                <Text h4>Why I created this tool</Text>
                <Text>I often struggle to self reflect, explore difficult ideas or fight stubborn patterns of thought: My mind is quick to get distracted or to interrupt itself with opposing opinions. I have found that guided meditation can help me here: It allows me to drop inherent resistance, be more receiptive to change and make it easier for me to resist distractions. </Text>
                <Text>Meditation apps are great! But either they focus on core meditation techniques (e.g. around mindfulness or gratitude meditations) or they address very general themes. Naturally, they cannot be specific to the meditators personal thoughts nor should they.</Text>
                <Text>And here technology can lend us a hand: ChatGPT is able to generate surprisingly gentle, visual and specific scripts. And today's Text-to-Speech technology makes the scripts come to life.</Text>
              </Modal.Body>

              <Modal.Footer>
                <Button auto onPress={() => setVisible(false)} aria-label="close">
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>


        <div style={{ "margin": "16px 0 32px", "width": "100%" }}>

          <Textarea
            placeholder="Example: 'I want to cultivate more positivity towards my future'"
            ref={inputRef}
            value={topicInput}
            onChange={handleInputChange}
            fullWidth={true}
            disabled={loading || audioSrc}
            aria-label="meditation-topic"
          />

          <div style={{ "margin": "16px 0 16px", "display": "flex", "justifyContent": "center" }}>
            <Radio.Group  
              orientation="horizontal" 
              defaultValue="5" 
              value={duration} 
              onChange={setDuration}
              isDisabled={loading || audioSrc}
              aria-label="duration"
            >
              <Radio value="5">
                <Text>5 min</Text>
              </Radio>
              <Tooltip content={"I am working on improving this tool. Please leave feedback above if this is important to you :)"}>
                <Radio value="10" isDisabled>
                  <Text>10 min (coming soon)</Text>
                </Radio>
              </Tooltip>
            </Radio.Group>
          </div>

            {
              audioSrc ? 
                <div style={{ "margin": "48px 0 48px", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center" }}>

                  <div>
                    <ReactAudioPlayer src={audioSrc} controls style={{"margin": "8px"}}/>

                    <div className="music-controls" style={{ "display": "flex", "justifyContent": "center", "alignItems": "center"}}>
                      <label htmlFor="music" style={{ "margin": "0 8px"}}>Music</label>
                      <input
                        style={{ "margin": "0 8px"}}
                        id="music"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        disabled={!isPlaying}
                      />
                    </div>
                  
                  </div>

                  <Button 
                    light
                    color="primary" 
                    onPress={() => setAudioSrc('')} 
                    style={{ "margin": "64px"}}
                    aria-label="new-meditation">
                      Start a new meditation
                    </Button>

                </div>
              :
                (loading ? 
                  <div>
                    <Lottie style={{ "height": "100px" }} animationData={loadingAnimation} loop={true} />
                  </div>
                :
                <div style={{ "height": "100px", "display": "flex", "alignItems": "center", "justifyContent": "center"  }}>
                  <Button 
                    onPress={onSubmit} 
                    onKeyDown={(e) => (e.key === "Enter" ? onSubmit() : null)}
                    disabled={!topicInput}
                    aria-label="create-meditation">
                      {topicInput ? "Create your meditation" : "Please enter a topic"}
                  </Button>
                </div>)
            }
        </div>
        
      </main>
    </div>
  );
}
