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

    for (let i = resultsWindow.length - 1; i >= 0; i--) {
        const token = resultsWindow[i];
        // position is i
        if (voiceStates[currentState].allowedNextStates.includes(token)) {
            // [token] is an allowed next state

            // TODO: consider storing resultsWindow[i:] in the current state (e.g. for search)
            setCurrentState(token);
            // await _cancelRecognizing();
            return;
        }
    }
}

const handleState = async ({
    currentState, 
    voiceStates
}) => {
    const state = voiceStates[currentState];

    if (state.systemResponses.length > 0) {
        // there exist system responses to play
        // TODO: randomly play a system response
        const { id, title, url } = state.systemResponses[0];
        // create track for react native track player
        const track = createVoiceTrack(state.systemResponses[0]);
        await playVoiceTrack(track, state.handleFunc);
        console.log('A');
        return;
    }

    console.log('B');
    state.handleFunc();
}

export { 
    setQueue,
    parseResults, 
    getWindow, 
    detectState, 
    handleState 
};