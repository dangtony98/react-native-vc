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
        // for each token in the results window (backwards)
        const token = resultsWindow[i];

        for (let j = 0; j < state.neighbors.length; j++) {
            // for each neighboring state
            const neighbor = state.neighbors[j];
            for (let k = 0; k < voiceStates[neighbor].names.length; k++) {
                // for each name (alt) of neighboring state
                if (voiceStates[neighbor].names[k] === token) {
                    // case: [token] matching a neighboring state name matched
                    setCurrentState(neighbor);
                    // consider [payload] as all tokens after the token in position [i] of [resultsWindow]
                    const payload = resultsWindow.slice(i + 1);
                    console.log('payload');
                    console.log(payload);

                    voiceStates[neighbor].handleFunc(payload);
                    return;
                }
            }
        }
    }
}

export { 
    setQueue,
    parseResults, 
    getWindow, 
    detectState, 
    playVoiceTrack
};