/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { Component, useEffect, useState } from 'react';
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
import _ from 'lodash';

const VOICES = ['com.apple.ttsbundle.Maged-compact', 'com.apple.ttsbundle.Zuzana-compact', 'com.apple.ttsbundle.Sara-compact', 'com.apple.ttsbundle.Anna-compact', 'com.apple.ttsbundle.Melina-compact', 'com.apple.ttsbundle.Karen-compact', 'com.apple.ttsbundle.Daniel-compact', 'com.apple.ttsbundle.Moira-compact', 'com.apple.ttsbundle.Rishi-compact', 'com.apple.ttsbundle.Samantha-compact', 'com.apple.ttsbundle.Tessa-compact', 'com.apple.ttsbundle.Monica-compact', 'com.apple.ttsbundle.Paulina-compact', 'com.apple.ttsbundle.Satu-compact', 'com.apple.ttsbundle.Amelie-compact', 'com.apple.ttsbundle.Thomas-compact', 'com.apple.ttsbundle.Carmit-compact', 'com.apple.ttsbundle.Lekha-compact', 'com.apple.ttsbundle.Mariska-compact', 'com.apple.ttsbundle.Damayanti-compact', 'com.apple.ttsbundle.Alice-compact', 'com.apple.ttsbundle.Kyoko-compact', 'com.apple.ttsbundle.Yuna-compact', 'com.apple.ttsbundle.Ellen-compact', 'com.apple.ttsbundle.Xander-compact', 'com.apple.ttsbundle.Nora-compact', 'com.apple.ttsbundle.Zosia-compact', 'com.apple.ttsbundle.Luciana-compact', 'com.apple.ttsbundle.Joana-compact', 'com.apple.ttsbundle.Ioana-compact', 'com.apple.ttsbundle.Milena-compact', 'com.apple.ttsbundle.Laura-compact', 'com.apple.ttsbundle.Alva-compact', 'com.apple.ttsbundle.Kanya-compact', 'com.apple.ttsbundle.Yelda-compact', 'com.apple.ttsbundle.Ting-Ting-compact', 'com.apple.ttsbundle.Sin-Ji-compact', 'com.apple.ttsbundle.Mei-Jia-compact']

const JUMP_HOME = ['jump', 'home'];
const JUMP_EXPLORE = ['jump', 'explore'];
const JUMP_SEARCH = ['jump', 'search'];

const VOICE_STATES = {
  tutorial: {
    state: 'tutorial',
    firstSystemResponses: [],
    systemResponses: []
  },
  home: {
    state: 'home',
    firstSystemResponses: [],
    systemResponses: [{
      id: 'voice-123',
      title: 'Home',
      url: 'https://audio-social.s3.us-east-2.amazonaws.com/voice-response/bdecb2b0-2433-4293-8f06-2b2796c67ad5.mp3'
    }],
    allowedCommands: [JUMP_EXPLORE, JUMP_SEARCH]
  },
  explore: {
    state: 'explore',
    firstSystemResponses: [],
    systemResponses: [{
      id: 'voice-234',
      title: 'Explore',
      url: 'https://audio-social.s3.amazonaws.com/voice-response/d4804e97-8265-4c32-8040-bdfbd29417c3.mp3'
    }],
    allowedCommands: [JUMP_HOME]
  }
}

const STATE_TOKENS = Object.keys(VOICE_STATES);

const App = () => {
  const [currentState, setCurrentState] = useState('home');
  const [pitch, setPitch] = useState('');
  const [error, setError] = useState('');
  const [end, setEnd] = useState('');
  const [recognized, setRecognized] = useState('');
  const [started, setStarted] = useState('');
  const [results, setResults] = useState([]);
  const [partialResults, setPartialResults] = useState([]);

  const [resultsWindow, setResultsWindow] = useState([]);
  const [partialResultsWindow, setPartialResultsWindow] = useState([]);

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
      setCurrentState,
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