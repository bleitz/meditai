import Head from "next/head";
import { useState, useRef } from "react";
import styles from "./index.module.css";

import { Text, Button, Image, Modal, useModal, Switch } from '@nextui-org/react';

import Lottie from "lottie-react";
import loadingAnimation from "../public/circle-animation.json";

import { initializeApp } from "firebase/app";
import { getFirestore, updateDoc, addDoc, collection } from "firebase/firestore";
import { PromptInput } from "../components/PromptInput";
import { ContentModal } from "../components/ContentModal";

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

  const { setVisible, bindings } = useModal();

  const musicRef = useRef(null);

  const togglePlay = () => {
    const music = musicRef.current;
    isPlaying ? music.pause() : music.play();
    setIsPlaying(!isPlaying);
  };  

  const handleMusicToggle = (e) => {
    const music = musicRef.current;
    e.target.checked ? music.play() : music.pause();
  };
  
  async function onSubmit(event) {
    const host = window.location.hostname;

    setLoading(true);

    try {

      // Log prompt to Firebase
      const promptDocRef = await addDoc(collection(db, "prompts"), {
        prompt: topicInput,
        duration: duration,
        timestamp: new Date(),
        promptURL: window.location.href
      });      

      if (host != "localhost") {
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

        // Get timed audio files
        const blob = await getAudio(scriptString, duration);
        setAudioSrc(URL.createObjectURL(blob));
        
        setLoading(false);
      } else {

        // Set a timer to simulate the async operations when testing the UI locally
        const blob = await setTimeout(() => {
          setAudioSrc("blah");
          setLoading(false);
        }, 3000); 
      }

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
        <audio loop src="music.mp3" ref={musicRef}></audio>

        <div style={{ "margin": "16px 0 48px", "display": "flex", "flexDirection": "column", "alignItems": "center" }}>
          <div style={{ "margin": "40px" }}>
            <Image width={150} height={150} src="logo-noname.png" alt="Logo" objectFit="cover"/>
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

              <ContentModal setVisible={setVisible} bindings={bindings}/>

            </div>
          </div>
        </div>


        <div style={{ "margin": "16px 0 32px", "width": "100%" }}>

            <PromptInput
              topicInput={topicInput}
              setTopicInput={setTopicInput} 
              audioSrc={audioSrc}
              loading={loading}
              duration={duration}
              setDuration={setDuration}
            />

            {
              audioSrc ? 
                <div style={{ "margin": "48px 0 48px", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center" }}>
                  <div>
                    <audio 
                      src={audioSrc} 
                      onPlay={togglePlay}
                      onPause={togglePlay}
                      controls
                      onEnded={() => setIsPlaying(false)}
                      style={{"margin": "8px"}}
                    ></audio>

                    <div className="music-controls" style={{ "display": "flex", "justifyContent": "center", "alignItems": "center"}}>
                      <label htmlFor="music" style={{ "margin": "0 8px"}}>Music</label>
                      <Switch 
                        style={{ "margin": "0 8px"}}
                        id="music"
                        initialChecked
                        onChange={handleMusicToggle}
                        disabled={!isPlaying}>
                      </Switch>
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
                  //Loading animation
                  <div>
                    <Lottie style={{ "height": "100px" }} animationData={loadingAnimation} loop={true} />
                  </div>
                :
                //Primary CTA
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
