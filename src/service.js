import TrackPlayer, { Event } from 'react-native-track-player';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

var nextSound = new Sound('next_audio.mp3', Sound.MAIN_BUNDLE, (error) => {
if (error) {
    console.log('failed to load the sound', error);
    return;
    }
    // if loaded successfully
    console.log('duration in seconds: ' + nextSound.getDuration() + 'number of channels: ' + nextSound.getNumberOfChannels());
});

module.exports = async function() {
    // This service needs to be registered for the module to work
    // but it will be used later in the "Receiving Events" section
    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async data => {

        if (data.nextTrack != null) {
            // case: [nextTrack] is not null

             // update current audio id
            const nextTrack = await TrackPlayer.getTrack(data.nextTrack);
            console.log(nextTrack.id);

            if (!nextTrack.id.includes('voice')) {
                // case: next track is not voice related
                nextSound.play(success => {
                    if (success) {
                        console.log('successfully finished playing');
                    } else {
                        console.log('playback failed due to audio decoding errors');
                    }
                });
            }
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async data => {
    return TrackPlayer.seekTo(0);
    });

    TrackPlayer.addEventListener(Event.PlaybackState, async ({state}) => {
        // console.log('state');
        // console.log(state);
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