import TrackPlayer from "react-native-track-player";

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
    await TrackPlayer.reset();
    await TrackPlayer.add(queue);
    await TrackPlayer.play();
};

const parseResults = (resultsText) => resultsText.toLowerCase().split(' ');

const getWindow = (resultsArr, windowSize) => {
    // get window for voice recognition

    return (
        resultsArr.length > windowSize 
        ? resultsArr.slice(-windowSize) 
        : resultsArr
    ); 
}

const handleStateResponse = async (state) => {
    if (state.systemResponses.length > 0) {
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

const detectState = async ({
    resultsWindow, 
    currentState,
    setCurrentState,
    voiceStates,
    _cancelRecognizing
}) => {
    // check if [resultsWindow] contains any tokens in [currentState.neighbors]

    console.log('resultsWindow');
    console.log(resultsWindow);

    const state = voiceStates[currentState];
    for (let i = resultsWindow.length - 1; i >= 0; i--) {
        const token = resultsWindow[i];
        // position is [i]
        if (state.neighbors.includes(token)) {
            // [token] is a neighbor -> go to next voice state

            // TODO: consider storing resultsWindow[i:] in the current state (e.g. for search)
            setCurrentState(token);
            handleStateResponse(voiceStates[token]);
            return;
        }
    }
}

export { 
    setQueue,
    parseResults, 
    getWindow, 
    detectState, 
    handleStateResponse
};