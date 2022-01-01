import TrackPlayer from "react-native-track-player";
import Voice from '@react-native-voice/voice';

const startVoice = async () => {
    console.log('startVoice()');
    try {
        await Voice.start('en-US');
    } catch (e) {
        console.error(e);
    }
}

const createVoiceTrack = (item) => {
    return {
      id: item.id,
      url: item.url,
      title: item.title,
      artist: 'Auledge',
      duration: item.duration
    };
  };

const createTrack = (item) => {
    return {
      id: item.id,
      url: item.url,
      title: item.title,
      artist: 'Auledge'
    };
  };

const playVoiceTrack = async (track, callback) => {
    // reset track player and play [track]
    await TrackPlayer.reset();
    await TrackPlayer.add([track]);
    await TrackPlayer.play();

    // TO-DO: make sure callback is accurate?
    // execute [callback] after track finishes playing
    setTimeout(function(){
        callback();
    }, track.duration);
};

const setQueue = async (tracks) => {
    // standard setQueue function
    const queue = tracks.map(track => createTrack(track));
    await TrackPlayer.add(queue);
    await TrackPlayer.play();
};

const parseResults = (resultsText) => {
    // returns [text] with each token as a lowercase element in array
    return resultsText.toLowerCase().split(' ');
};

const getWindow = (resultsArr, windowSize) => {
    // get window for voice recognition

    return (
        resultsArr.length > windowSize 
        ? resultsArr.slice(-windowSize) 
        : resultsArr
    ); 
}

const detectState = async ({
    resultsWindow, 
    stateTokens,
    currentState,
    setCurrentState,
    voiceStates,
    _cancelRecognizing
}) => {
    // check if [resultsWindow] contains any tokens in [currentState.allowedNextStates]
    console.log('allowedNext');
    console.log(voiceStates[currentState].allowedNextStates);
    console.log(resultsWindow);

    // return state token if detected in [resultsWindow]
    for (let i = 0; i < voiceStates[currentState].allowedNextStates.length; i++) {
        const stateToken = voiceStates[currentState].allowedNextStates[i];
        const stateTokenIdx = resultsWindow.indexOf(stateToken);
        if (stateTokenIdx != -1) {
            // case: [stateToken] is present in [resultsWindow]
            // TODO: consider storing resultsWindow[stateTokenIdx:] in the current state
            setCurrentState(stateToken);
            console.log('state detected');
            await _cancelRecognizing();
            return;
        }
    }
}

const handleStateResponse = async (state) => {
    // handle state response where [state] is a state in [VOICE_STATES]
    // handleFunc to be triggered after system response is played

    if (state.systemResponses.length) {
        // there exist system responses to play
        // TODO: randomly play a system response
        const { id, title, url } = state.systemResponses[0];
        // create track for react native track player
        const track = createVoiceTrack(state.systemResponses[0]);
        await playVoiceTrack(track, state.handleFunc);
        return;
    }
    state.handleFunc();
}

const handleState = async ({
    currentState, 
    voiceStates,
    _startRecognizing,
    _cancelRecognizing
}) => {
    const state = voiceStates[currentState];

    switch (currentState) {
        case 'home':
            // handle home case
            console.log('home state');
            handleStateResponse(state);
            break;
        case 'explore':
            // handle explore case
            console.log('explore state');
            handleStateResponse(state);
            break;
        case 'next':
            // handle next case
            console.log('next state');
            handleStateResponse(state);
            break;
        case 'back':
            // handle back case
            console.log('back state');
            handleStateResponse(state);
            break;
        case 'play':
            // handle back case
            console.log('play state');
            handleStateResponse(state);
            break;
        case 'pause':
            // handle back case
            console.log('pause state');
            handleStateResponse(state);
            break;
    }
}

export { 
    setQueue,
    parseResults, 
    getWindow, 
    detectState, 
    handleState 
};