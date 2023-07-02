import React from "react";
import { Text, Textarea, Radio, Tooltip } from '@nextui-org/react';


//inputRef topicInput handleInputChange audioSrc loading duration setduration
export const PromptInput = (props) => {

    const handleInputChange = (e) => {
        props.setTopicInput(e.target.value);
      }

    return (
        <div>
            {/* Prompt input */}
            <Textarea
                placeholder="Example: 'I want to cultivate more positivity towards my future'"
                value={props.topicInput}
                onChange={handleInputChange}
                fullWidth={true}
                disabled={props.loading || props.audioSrc}
                aria-label="meditation-topic"
            />

            {/* Setting duration of meditation */}
            <div style={{ "margin": "16px 0 16px", "display": "flex", "justifyContent": "center" }}>
                <Radio.Group  
                    orientation="horizontal" 
                    defaultValue="5" 
                    value={props.duration} 
                    onChange={props.setDuration}
                    isDisabled={props.loading || props.audioSrc}
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
        </div>
    )
}