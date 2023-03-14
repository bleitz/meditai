import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import styles from "./index.module.css";

import ReactAudioPlayer from "react-audio-player";
import { Text, Textarea, Button, Radio, Image } from '@nextui-org/react';

import Lottie from "lottie-react";
import loadingAnimation from "../public/circle-animation.json";

export default function Home() {
  const [topicInput, setTopicInput] = useState("");
  const [audioSrc, setAudioSrc] = useState('');
  const [duration, setDuration] = useState("5");
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);

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

      // Set a timer to simulate the audio generation process when testing locally
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
        <title>meditai - Automated, personalized guided meditations</title>
        <link rel="icon" href="/logo-noname.png" />
      </Head>

      <main className={styles.main}>
        <audio loop src="music.mp3" ref={audioRef}></audio>


        <div style={{ "margin": "16px 0 48px" }}>
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
          <Text>Do you want to cultivate a specific thought or feeling? <br></br> Contemplate a particular topic?<br></br>  Manifest or internalise a concrete idea?</Text>
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
                5 min
              </Radio>
              <Radio value="10">
                10 min
              </Radio>
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

                  <Button bordered onPress={() => setAudioSrc('') && setTopicInput('')} style={{ "margin": "64px"}}>Generate a new meditation</Button>

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
                      {topicInput ? "Generate your meditation" : "Please enter a topic"}
                  </Button>
                </div>)
            }
        </div>
        
      </main>
    </div>
  );
}
