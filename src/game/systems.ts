import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { distance } from '../utils/geometry';
import { GameEntities } from './entities';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SystemArgs {
  touches: any[];
  time: { delta: number };
  dispatch: (event: { type: string }) => void;
}

export const Physics = (entities: GameEntities, { time, dispatch }: SystemArgs): GameEntities => {
  const { engine } = entities.physics;

  // Use fixed timestep for smooth, consistent physics
  const fixedDelta = 16.667; // 60fps target

  Matter.Engine.update(engine, fixedDelta);

  // Dispatch frame update to trigger re-render
  dispatch({ type: 'frame-update' });

  return entities;
};

export const CheckWinLose = (
  entities: GameEntities,
  { dispatch }: SystemArgs
): GameEntities => {
  const candy = entities.candy;
  const monster = entities.monster;
  if (!candy || !monster) return entities;

  const candyPos = candy.body.position;
  const monsterPos = monster.position;

  // Check win condition: candy reaches monster
  const dist = distance(candyPos, monsterPos);
  if (dist < candy.radius + monster.radius) {
    dispatch({ type: 'game-won' });
  }

  // Check lose condition: candy falls off screen
  if (candyPos.y > SCREEN_HEIGHT + 100) {
    dispatch({ type: 'game-lost' });
  }

  return entities;
};
