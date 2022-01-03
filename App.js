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
  handleStateResponse
} from './src/handlePhraseProcessing';
import Voice from '@react-native-voice/voice';
import TrackPlayer, { Capability } from 'react-native-track-player';
import _, { partial } from 'lodash';
import { client } from './src/client';
import getAudioQuery from './src/queries/getAudio';
import { setQueue } from './src/handlePhraseProcessing';
import { reformatSearchPayload } from './src/handleAppOps';

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

    handleStateResponse(VOICE_STATES[currentState]);

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

  const VOICE_STATES = {
    tutorial: {
      systemResponses: [],
      handleFunc: (payload) => {}
    },
    home: {
      systemResponses: [{
        id: 'voice-123',
        title: 'Home',
        url: 'https://audio-social.s3.us-east-2.amazonaws.com/voice-response/bdecb2b0-2433-4293-8f06-2b2796c67ad5.mp3',
        artist: 'Auledge',
        duration: 6000
      }],
      handleFunc: (payload) => {
        _startRecognizing();
      },
      names: ['home'],
      neighbors: ['explore', 'search']
    },
    explore: {
      systemResponses: [{
        id: 'voice-234',
        title: 'Explore',
        url: 'https://audio-social.s3.amazonaws.com/voice-response/d4804e97-8265-4c32-8040-bdfbd29417c3.mp3',
        artist: 'Auledge',
        duration: 3000
      }],
      handleFunc: (payload) => {
        // start playing audio queue
        refetch();
        _startRecognizing();
        if (data?.getAudio) {
          console.log(data.getAudio);
          setQueue(data?.getAudio);
        }
      },
      names: ['explore'],
      neighbors: ['next', 'back', 'home', 'pause']
    },
    search: {
      systemResponses: [{
        id: 'voice-123',
        title: 'Search',
        url: 'https://audio-social.s3.us-east-2.amazonaws.com/voice-response/bdecb2b0-2433-4293-8f06-2b2796c67ad5.mp3',
        artist: 'Auledge',
        duration: 6000
      }],
      handleFunc: (payload) => {
        // TODO: preprocess [payload] and enter it into search input
        console.log('Inside search handleFunc');
        console.log(payload);
        // payload = ['for', 'a', 'user']
        const searchQuery = reformatSearchPayload(payload) // this is a string

        // TODO: have Google Cloud API read out [searchQuery]
        onChangeText(searchQuery);
      },
      names: ['search'],
      neighbors: ['next', 'back', 'home', 'pause']
    },
    next: {
      // systemResponses: [{
      //   id: 'voice-345',
      //   title: 'Next',
      //   url: 'https://audio-social.s3.us-east-2.amazonaws.com/sfx/next_audio.mp3',
      //   artist: 'Auledge',
      //   duration: 150
      // }],
      systemResponses: [],
      handleFunc: async (payload) => {
        // play next
        _startRecognizing();
        await TrackPlayer.skipToNext();
      },
      names: ['next'],
      neighbors: ['next', 'back', 'home', 'play', 'pause']
    },
    back: {
      systemResponses: [],
      handleFunc: async (payload) => {
        // play previous
        _startRecognizing();
        await TrackPlayer.skipToPrevious();
      },
      names: ['back', 'previous'],
      neighbors: ['next', 'back', 'home', 'play', 'pause']
    },
    play: {
      systemResponses: [],
      handleFunc: async (payload) => {
        // play
        _startRecognizing();
        await TrackPlayer.play();
      },
      names: ['play'],
      neighbors: ['next', 'back', 'home', 'pause']
    },
    pause: {
      systemResponses: [],
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