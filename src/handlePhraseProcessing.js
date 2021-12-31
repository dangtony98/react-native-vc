import TrackPlayer from "react-native-track-player";

const playTrack = async (track) => {
    // reset track player and play [track]
    await TrackPlayer.reset();
    await TrackPlayer.add([track]);
    await TrackPlayer.play();
};

const parseResults = (resultsText) => {
    // returns [text] with each token as a lowercase element in array
    return resultsText.toLowerCase().split(' ');
};

const getWindow = (resultsArr, windowSize) => {
    // get window for voice recognition

    /* 
    TODO: can we fix window to be based on when user stops talking or must it be based on a set [windowSize]
    */
    return (
        resultsArr.length > windowSize 
        ? resultsArr.slice(-windowSize) 
        : resultsArr
    ); 
}

const detectState = async ({
    resultsWindow, 
    stateTokens,
    setCurrentState,
    _cancelRecognizing
}) => {
    // check if [resultsWindow] contains any [actionToken] and return it

    // return state token if detected in [resultsWindow]
    for (let i = 0; i < stateTokens.length; i++) {
        const stateToken = stateTokens[i];
        if (resultsWindow.includes(stateToken)) {
            setCurrentState(stateToken);
            await _cancelRecognizing();
            return;
        }
    }
}

/* 

command:
payload: how do you know when user stops talking?

---
example:

command: search
payload: for cryptocurrency
*/

const handleState = async ({
    currentState, 
    voiceStates,
    _startRecognizing,
    _cancelRecognizing
}) => {

    const { id, title, url } = voiceStates[currentState].systemResponses[0];

    // create track for react native track player
    const track = {
        id,
        url,
        title,
        artist: 'Auledge'
    };

    switch (currentState) {
        case 'home':
            // handle home case
            console.log('home state');
            playTrack(track);
            break;
        case 'explore':
            // handle explore case
            console.log('explore state');
            playTrack(track);
            break;
    }
}

export { 
    parseResults, 
    getWindow, 
    detectState, 
    handleState 
};