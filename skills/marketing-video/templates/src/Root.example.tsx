// One component, several shapes: the scene reads useVideoConfig() and lays itself out per size.
import React from 'react';
import { Composition } from 'remotion';
import { Hero, T } from './Hero.example';

export const Root: React.FC = () => (
  <>
    <Composition id="Hero" component={Hero} durationInFrames={T.end} fps={30} width={1280} height={800} />
    <Composition id="HeroSquare" component={Hero} durationInFrames={T.end} fps={30} width={1080} height={1080} />
    <Composition id="HeroVertical" component={Hero} durationInFrames={T.end} fps={30} width={1080} height={1920} />
  </>
);
