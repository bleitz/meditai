import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import styles from "./index.module.css";

import ReactAudioPlayer from "react-audio-player";
import { Text, Textarea, Button, Radio, Image, Tooltip, Modal, useModal, Link } from '@nextui-org/react';

import Lottie from "lottie-react";
import loadingAnimation from "../public/circle-animation.json";

export default function Home() {
  const [topicInput, setTopicInput] = useState("");
  const [audioSrc, setAudioSrc] = useState('');
  const [duration, setDuration] = useState("5");
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);

  const { setVisible, bindings } = useModal();

  const audioRef = useRef(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };  

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    audio.volume = e.target.value;
    setVolume(e.target.value);
  };

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  
  
  async function onSubmit(event) {

    setLoading(true);

    try {

      // Get raw chatGPT script
      const scriptString = await getScript(topicInput);
      console.log(scriptString)

      // Get timed audio
      const blob = await getAudio(scriptString, duration);
      setAudioSrc(URL.createObjectURL(blob));

      // Set a timer to simulate the async operations when testing the UI locally
      /* const blob = await setTimeout(() => {
        setAudioSrc("blah");
        setLoading(false);
      }, 3000); */

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
        <title>meditai - Personalized, automated guided meditations</title>
        <link rel="icon" href="/logo-noname.png" />
      </Head>

      <main className={styles.main}>
        <audio loop src="music.mp3" ref={audioRef}></audio>

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

          <Text h2>How can I guide your meditation?</Text>
          <Text>Do you want to cultivate a specific feeling? Contemplate a topic? Internalise a thought?</Text>
          
          <div>
            <div style={{"display": "flex"}}>
            <Button auto light color="primary" onPress={() => setVisible(true)}>
              Learn more
            </Button>
            <Button auto light color="primary">
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
                <Text>This is a simple tool that automatically creates a personalized, guided meditation. Use it to explore specific thoughts and feelings, for guidance or to bring more intent to your everyday life.</Text>
                <Text>Know someone whom would be helped with this? Share it with them!</Text>
                <Text>Questions? Ask them: <a href="mailto:benni_leitz@hotmail.com" rel="noopener noreferrer">benni_leitz@hotmail.com</a></Text>
                <Text>The script is genererated by OpenAI's GPT-3 API. The audio is generated by Azure's Text-to-Speech API. Music by Andrewkn. Loading animation by Wan Souza.</Text>
                
                <Text h4>Why I created this tool</Text>
                <Text>I often struggle to self reflect, explore difficult ideas or fight stubborn patterns of thought: My mind is quick to get distracted or to interrupt itself with opposing opinions. I have found that guided meditation can help me here: It allows me to drop inherent resistance, be more receiptive to change and make it easier for me to resist distractions. </Text>
                <Text>Meditation apps are great! But either they focus on core meditation techniques (e.g. around mindfulness or gratitude meditations) or they address very general themes. Naturally, they cannot be specific to the meditators personal thoughts nor should they.</Text>
                <Text>And here AI can lend us a hand: ChatGPT is able to generate surprisingly gentle, visual and specific scripts. And todays Text-to-Speech technology makes the scripts come to life.</Text>
              </Modal.Body>

              <Modal.Footer>
                <Button auto onPress={() => setVisible(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>


        <div style={{ "margin": "16px 0 32px", "width": "100%" }}>

          <Textarea
            placeholder="e.g. I want to cultivate more positivity towards my future"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            fullWidth={true}
            disabled={loading || audioSrc}
          />

          <div style={{ "margin": "16px 0 16px", "display": "flex", "justifyContent": "center" }}>
            <Radio.Group  
              orientation="horizontal" 
              defaultValue="5" 
              value={duration} 
              onChange={setDuration}
              isDisabled={loading || audioSrc}
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

                    <ReactAudioPlayer src={audioSrc} controls onPlay={togglePlay} onPause={togglePlay} style={{"margin": "8px"}}/>

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
                    style={{ "margin": "64px"}}>
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
                    disabled={!topicInput}>
                      {topicInput ? "Create your meditation" : "Please enter a topic"}
                  </Button>
                </div>)
            }
        </div>
        
      </main>
    </div>
  );
}
