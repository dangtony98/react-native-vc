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
  TouchableOpacity,
  TextInput
} from 'react-native';
import { 
  parseResults, 
  getWindow, 
  detectState, 
  handleState,
  playVoiceTrack
} from './src/handlePhraseProcessing';
import Voice from '@react-native-voice/voice';
import TrackPlayer, { Capability } from 'react-native-track-player';
import _, { partial } from 'lodash';
import { client } from './src/client';
import getAudioQuery from './src/queries/getAudio';
import { setQueue } from './src/handlePhraseProcessing';
import { reformatSearchPayload } from './src/handleAppOps';
import Sound from 'react-native-sound';

import { 
  HOME_TRACK,
  EXPLORE_TRACK,
  SEARCH_TRACK
} from './src/tracks';

const VoiceScreen = () => {
  const [text, onChangeText] = useState("Useless Text");
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
    refetch,
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

    VOICE_STATES[currentState].handleFunc();

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
      currentState,
      setCurrentState,
      voiceStates: VOICE_STATES,
      _cancelRecognizing
    });
  }, [results]);

  // TODO: consider refactor to using react native sound to play
  // voice tracks

  const VOICE_STATES = {
    tutorial: {
      handleFunc: (payload) => {}
    },
    home: {
      handleFunc: (payload) => {
        playVoiceTrack(HOME_TRACK);
          // Play the sound with an onEnd callback
        setTimeout(() => {
          _startRecognizing();
        }, HOME_TRACK.duration);
      },
      names: ['home'],
      neighbors: ['explore', 'search']
    },
    explore: {
      handleFunc: (payload) => {
        // start playing audio queue
        playVoiceTrack(EXPLORE_TRACK);
        setTimeout(() => {
          refetch();
          _startRecognizing();
          if (data?.getAudio) {
            console.log(data.getAudio);
            setQueue(data?.getAudio);
          }
        }, EXPLORE_TRACK.duration);
      },
      names: ['explore'],
      neighbors: ['next', 'back', 'home', 'pause']
    },
    search: {
      handleFunc: (payload) => {
        // TODO: preprocess [payload] and enter it into search input
        playVoiceTrack(SEARCH_TRACK);
        setTimeout(() => {
          _startRecognizing();
          const searchQuery = reformatSearchPayload(payload) // this is a string
          // TODO: have Google Cloud API read out [searchQuery]
          onChangeText(searchQuery);
        }, SEARCH_TRACK.duration);
      },
      names: ['search'],
      neighbors: ['next', 'back', 'home', 'pause']
    },
    next: {
      handleFunc: async (payload) => {
        // play next
        // TODO: say name of next track before playing it?
        // Pause. Say. Play?
        _startRecognizing();
        await TrackPlayer.skipToNext();
      },
      names: ['next'],
      neighbors: ['next', 'back', 'home', 'play', 'pause']
    },
    back: {
      handleFunc: async (payload) => {
        // play previous
        _startRecognizing();
        await TrackPlayer.skipToPrevious();
      },
      names: ['back', 'previous'],
      neighbors: ['next', 'back', 'home', 'play', 'pause']
    },
    play: {
      handleFunc: async (payload) => {
        // play
        _startRecognizing();
        await TrackPlayer.play();
      },
      names: ['play'],
      neighbors: ['next', 'back', 'home', 'pause']
    },
    pause: {
      handleFunc: async (payload) => {
        // pause
        _startRecognizing();
        await TrackPlayer.pause();
      },
      names: ['pause'],
      neighbors: ['next', 'back', 'home', 'play']
    },
  }

  return (
      <View style={{ flex: 1, paddingTop: 50 }}>
        <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          value={text}
        />
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
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  }
});

export default App;