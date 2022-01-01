import TrackPlayer, { Event } from 'react-native-track-player';
import Voice from '@react-native-voice/voice';


module.exports = async function() {
    // This service needs to be registered for the module to work
    // but it will be used later in the "Receiving Events" section
    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async data => {
    });

    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async data => {
        return TrackPlayer.seekTo(0);
      });
    
      TrackPlayer.addEventListener(Event.RemotePlay, () => {
        console.log('remote-play');
        return TrackPlayer.play();
      });
    
      TrackPlayer.addEventListener(Event.RemotePause, () => {
        console.log('remote-pause');
        return TrackPlayer.pause();
      });
    
      TrackPlayer.addEventListener(Event.RemoteNext, data => {
        console.log('remote-next');
        return TrackPlayer.skipToNext();
      });
    
      TrackPlayer.addEventListener(Event.RemotePrevious, data => {
        console.log('remote-previous');
        return TrackPlayer.skipToPrevious();
      });
}