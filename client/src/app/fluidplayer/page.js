import { useEffect } from 'react';
import fluidPlayer from 'fluid-player';

const FluidPlayerComponent = ({ src, vastTag }) => {
  useEffect(() => {
    const videoElement = document.getElementById('my-video');

    if (videoElement) {
      const options = {
        layoutControls: {
          controlBar: {
            autoHide: true,
          },
        },
        vastOptions: {
          adList: vastTag ? [vastTag] : [],
        },
      };

      fluidPlayer(videoElement, options);
    }
  }, [src, vastTag]);

  return <video id="my-video" controls />;
};

export default FluidPlayerComponent;
