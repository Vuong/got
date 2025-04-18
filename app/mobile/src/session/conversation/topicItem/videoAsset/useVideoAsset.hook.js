import { useState, useRef, useEffect, useContext } from 'react';
import { ConversationContext } from 'context/ConversationContext';
import { Image } from 'react-native';
import { useWindowDimensions, Platform } from 'react-native';
import RNFS from "react-native-fs";
import Share from 'react-native-share';

export function useVideoAsset(asset) {

  let [state, setState] = useState({
    frameWidth: 1,
    frameHeight: 1,
    videoRatio: 1,
    thumbRatio: 1,
    width: 1,
    height: 1,
    thumbWidth: 64,
    thumbHeight: 64,
    url: null,
    playing: false,
    thumbLoaded: false,
    videoLoaded: false,
    controls: false,
    downloaded: false,
  });

  let controls = useRef(null);
  let conversation = useContext(ConversationContext);
  let dimensions = useWindowDimensions();

  let updateState = (value) => {
    setState((s) => ({ ...s, ...value }));
  }

  useEffect(() => {
    let frameRatio = state.frameWidth / state.frameHeight;
    if (frameRatio > state.thumbRatio) {
      //thumbHeight constrained
      let thumbHeight = 0.9 * state.frameHeight;
      let thumbWidth = thumbHeight * state.thumbRatio;
      updateState({ thumbWidth, thumbHeight }); 
    }
    else {
      //thumbWidth constrained
      let thumbWidth = 0.9 * state.frameWidth;
      let thumbHeight = thumbWidth / state.thumbRatio;
      updateState({ thumbWidth, thumbHeight });
    }
    if (frameRatio > state.videoRatio) {
      //height constrained
      let height = 0.9 * state.frameHeight;
      let width = height * state.videoRatio;
      updateState({ width, height }); 
    }
    else {
      //width constrained
      let width = 0.9 * state.frameWidth;
      let height = width / state.videoRatio;
      updateState({ width, height });
    }
  }, [state.frameWidth, state.frameHeight, state.videoRatio, state.thumbRatio]);

  useEffect(() => {
    updateState({ frameWidth: dimensions.width, frameHeight: dimensions.height });
  }, [dimensions]);

  useEffect(() => {
    if (asset.encrypted) {
      updateState({ url: asset.decrypted, failed: asset.error });
    }
    else {
      updateState({ url: asset.hd });
    }
  }, [asset]);

  let actions = {
    share: async () => {
      let epoch = Math.ceil(Date.now() / 1000);
      let path = RNFS.TemporaryDirectoryPath + epoch + '.mp4';
      if (await RNFS.exists(path)) {
        await RNFS.unlink(path);
      }
      if (state.url.substring(0, 7) === 'file://') {
        await RNFS.copyFile(state.url.split('?')[0], path);
      }
      else {
        await RNFS.downloadFile({ fromUrl: state.url, toFile: path }).promise;
      }
      Share.open({ url: path });
    },
    download: async () => {
      if (!state.downloaded) {
        updateState({ downloaded: true });
        let epoch = Math.ceil(Date.now() / 1000);
        let dir = Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.DownloadDirectoryPath;
        let path = `${dir}/databag_${epoch}.mp4`
        if (state.url.substring(0, 7) === 'file://') {
          await RNFS.copyFile(state.url.substring(7).split('?')[0], path);
        }
        else {
          await RNFS.downloadFile({ fromUrl: state.url, toFile: path }).promise;
        }
        if (Platform.OS !== 'ios') {
          await RNFS.scanFile(`${path}`);
        }
        updateState({ showDownloaded: true });
        setTimeout(() => { updateState({ showDownloaded: false }) }, 2000);
      }
    },
    setThumbSize: (e) => {
      let { width, height } = e.nativeEvent || {};
      updateState({ thumbLoaded: true, thumbRatio: width / height });
    },
    setVideoSize: (e) => {
      let { width, height } = e.naturalSize || {};
      updateState({ videoLoaded: true, videoRatio: width / height });
    },
    play: () => {
      actions.showControls();
      updateState({ playing: true });
    },
    pause: () => {
      updateState({ playing: false });
    },
    showControls: () => {
      clearTimeout(controls.current);
      updateState({ controls: true });
      controls.current = setTimeout(() => {
        updateState({ controls: false });
      }, 2000);
    },
  };

  return { state, actions };
}

