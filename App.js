/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { Component, useEffect, useState } from 'react';
import {ApolloProvider, useQuery } from '@apollo/client';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity
} from 'react-native';
import { 
  parseResults, 
  getWindow, 
  detectState, 
  handleState
} from './src/handlePhraseProcessing';
import Voice from '@react-native-voice/voice';
import TrackPlayer, { Capability } from 'react-native-track-player';
import _, { partial } from 'lodash';
import { client } from './src/client';
import getAudioQuery from './src/queries/getAudio';
import { setQueue } from './src/handlePhraseProcessing';

const VoiceScreen = () => {
  const [currentState, setCurrentState] = useState('home');
  const [pitch, setPitch] = useState('');
  const [error, setError] = useState('');
  const [end, setEnd] = useState('');
  const [recognized, setRecognized] = useState('');
  const [started, setStarted] = useState('');
  const [results, setResults] = useState([]);
  const [partialResults, setPartialResults] = useState([]);

  const [resultsWindow, setResultsWindow] = useState([]);

  const { 
    loading,
    error: audioError, 
    data,
    refetch: refetchAudio,
    fetchMore
  } = useQuery(getAudioQuery, {
    notifyOnNetworkStatusChange: true,
    variables: {
      offset: 0,
      limit: 15
    },
    fetchPolicy: 'cache-and-network'
  });

  const _startRecognizing = async () => {
    setPitch('');
    setError('');
    setStarted('');
    setResults([]);
    setPartialResults([]);
    setEnd('');

    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  };

  const _stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const _cancelRecognizing = async () => {
    try {
      await Voice.cancel();
    } catch (e) {
      console.error(e);
    }
  };

  const _destroyRecognizer = async () => {
    setPitch('');
    setError('');
    setStarted('');
    setResults([]);
    setPartialResults([]);
    setEnd('');
    try {
      await Voice.destroy();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const onSpeechStart = (e) => {
      // console.log('onSpeechStart: ', e);
      setStarted('√');
    };

    const onSpeechRecognized = (e) => {
      // console.log('onSpeechRecognized: ', e);
      setRecognized('√');
    };

    const onSpeechEnd = (e) => {
      // console.log('onSpeechEnd: ', e);
      setEnd('√');
    };
  
    const onSpeechError = (e) => {
      // console.log('onSpeechError: ', e);
      setError(e.error);
    };
  
    const onSpeechResults = (e) => {
      // console.log('onSpeechResults: ', e);
      setResults(e.value);
    };
  
    const onSpeechPartialResults = (e) => {
      // console.log('onSpeechPartialResults: ', e);
      setPartialResults(e.value);
    };
  
    const onSpeechVolumeChanged = (e) => {
      // console.log('onSpeechVolumeChanged: ', e);
      setPitch(e.value);
    };

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = _.debounce(onSpeechResults, 1000);
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

    TrackPlayer.updateOptions({
      // Media controls capabilities
      capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
      ],
  
      // Capabilities that will show up when the notification is in the compact form on Android
      compactCapabilities: [Capability.Play, Capability.Pause]
    });

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    }
  }, []);

  useEffect(() => {
    // called each time [results] changes
    const window = getWindow(parseResults(results?.[0] ? results[0] : ''), 5);
    setResultsWindow(window);

    const action = detectState({
      resultsWindow: window, 
      stateTokens: STATE_TOKENS,
      currentState,
      setCurrentState,
      voiceStates: VOICE_STATES,
      _cancelRecognizing
    });
  }, [results]);

  useEffect(() => {
    // called each time [currentState] changes
    handleState({
      currentState, 
      voiceStates: VOICE_STATES,
      _startRecognizing,
      _cancelRecognizing
    });
  }, [currentState]);

  // TODO: can a voice state be triggered by multiple words?
  const VOICE_STATES = {
    tutorial: {
      state: 'tutorial',
      firstSystemResponses: [],
      systemResponses: [],
      handleFunc: () => {}
    },
    home: {
      state: 'home',
      firstSystemResponses: [],
      systemResponses: [{
        id: 'voice-123',
        title: 'Home',
        url: 'https://audio-social.s3.us-east-2.amazonaws.com/voice-response/bdecb2b0-2433-4293-8f06-2b2796c67ad5.mp3',
        artist: 'Auledge',
        duration: 6000
      }],
      handleFunc: () => {
        _startRecognizing();
      },
      allowedNextStates: ['explore']
    },
    explore: {
      state: 'explore',
      firstSystemResponses: [],
      systemResponses: [{
        id: 'voice-234',
        title: 'Explore',
        url: 'https://audio-social.s3.amazonaws.com/voice-response/d4804e97-8265-4c32-8040-bdfbd29417c3.mp3',
        artist: 'Auledge',
        duration: 2000
      }],
      handleFunc: () => {
        // after system speaks, start playing audio queue
        if (data?.getAudio) {
          console.log(data.getAudio);
          setQueue(data?.getAudio);
        }
        _startRecognizing();
      },
      allowedNextStates: ['next', 'back', 'home', 'pause']
    },
    next: {
      state: 'next',
      firstSystemResponses: [],
      systemResponses: [],
      handleFunc: async () => {
        // play next
        await TrackPlayer.skipToNext();
        _startRecognizing();
      },
      allowedNextStates: ['next', 'back', 'home', 'pause']
    },
    back: {
      state: 'back',
      firstSystemResponses: [],
      systemResponses: [],
      handleFunc: async () => {
        // play previous
        await TrackPlayer.skipToPrevious();
        _startRecognizing();
      },
      allowedNextStates: ['next', 'back', 'play', 'pause', 'home']
    },
    play: {
      state: 'play',
      firstSystemResponses: [],
      systemResponses: [],
      handleFunc: async () => {
        // play previous
        await TrackPlayer.play();
        _startRecognizing();
      },
      allowedNextStates: ['next', 'back', 'home', 'pause']
    },
    pause: {
      state: 'pause',
      firstSystemResponses: [],
      systemResponses: [],
      handleFunc: async () => {
        // play previous
        await TrackPlayer.pause();
        _startRecognizing();
      },
      allowedNextStates: ['next', 'back', 'home', 'play']
    },
  }

  const STATE_TOKENS = Object.keys(VOICE_STATES);

  return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.button} onPress={_startRecognizing}>
          <Text>Start Recognizing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={_stopRecognizing}>
          <Text>Stop Recognizing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={_cancelRecognizing}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <Text>
          Results
        </Text>
        {resultsWindow && resultsWindow.map((result, index) => {
          return (
            <Text key={`partial-result-${index}`}>
              {result}
            </Text>
          );
        })}
    </View>
  );
}

const App = () => {
  return (
    <ApolloProvider client={client}>
      <VoiceScreen />
    </ApolloProvider>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    backgroundColor: 'blue',
    marginTop: 50,
    marginBottom: 50
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;