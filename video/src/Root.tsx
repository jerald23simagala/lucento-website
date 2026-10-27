import { Composition } from 'remotion';
import { Explainer, EXPLAINER_DURATION, EXPLAINER_FPS, EXPLAINER_HEIGHT, EXPLAINER_WIDTH } from './Explainer';

export const RemotionRoot = () => {
  return (
    <Composition
      id="Explainer"
      component={Explainer}
      durationInFrames={EXPLAINER_DURATION}
      fps={EXPLAINER_FPS}
      width={EXPLAINER_WIDTH}
      height={EXPLAINER_HEIGHT}
    />
  );
};
