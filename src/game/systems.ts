import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { distance } from '../utils/geometry';
import { GameEntities, Star, Bubble, AirCushion, Spike, CANDY_RADIUS } from './entities';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameEvent {
  type: string;
  starId?: string;
  position?: { x: number; y: number };
}

interface SystemArgs {
  touches: any[];
  time: { delta: number };
  dispatch: (event: GameEvent) => void;
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

export const CheckStarCollection = (
  entities: GameEntities,
  { dispatch }: SystemArgs
): GameEntities => {
  const candy = entities.candy;
  if (!candy) return entities;

  const candyPos = candy.body.position;

  // Check all stars
  Object.keys(entities).forEach(key => {
    if (key.startsWith('star')) {
      const star = entities[key] as Star;
      if (star && !star.collected) {
        const dist = distance(candyPos, star.position);
        if (dist < candy.radius + star.radius) {
          star.collected = true;
          dispatch({
            type: 'star-collected',
            starId: star.id,
            position: { ...star.position }
          });
        }
      }
    }
  });

  return entities;
};

export const BubbleMechanics = (
  entities: GameEntities,
  { dispatch }: SystemArgs
): GameEntities => {
  const candy = entities.candy;
  if (!candy) return entities;

  const candyBody = candy.body;
  const candyPos = candyBody.position;

  // Check all bubbles
  Object.keys(entities).forEach(key => {
    if (key.startsWith('bubble')) {
      const bubble = entities[key] as Bubble;
      if (bubble && bubble.active) {
        const dist = distance(candyPos, bubble.position);

        // Candy enters bubble
        if (dist < bubble.radius - candy.radius) {
          if (!bubble.capturedCandy) {
            bubble.capturedCandy = true;
            // Make candy float up
            Matter.Body.setVelocity(candyBody, { x: candyBody.velocity.x * 0.5, y: -2 });
          }
          // Apply upward force while in bubble
          Matter.Body.applyForce(candyBody, candyPos, { x: 0, y: -0.0003 });
        } else if (bubble.capturedCandy) {
          // Candy left bubble
          bubble.capturedCandy = false;
        }
      }
    }
  });

  return entities;
};

export const AirCushionMechanics = (
  entities: GameEntities,
  { time }: SystemArgs
): GameEntities => {
  const candy = entities.candy;
  if (!candy) return entities;

  const candyBody = candy.body;
  const candyPos = candyBody.position;

  // Check all air cushions
  Object.keys(entities).forEach(key => {
    if (key.startsWith('airCushion')) {
      const cushion = entities[key] as AirCushion;
      if (cushion && cushion.active) {
        // Check if candy is in front of air cushion (within range)
        const dx = candyPos.x - cushion.position.x;
        const dy = candyPos.y - cushion.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Air cushion has effect within 150 pixels
        if (dist < 150) {
          // Check if candy is in the direction of the cushion
          const dotProduct = dx * cushion.direction.x + dy * cushion.direction.y;
          if (dotProduct > 0) {
            // Apply force in cushion direction
            const forceMagnitude = 0.0005 * (1 - dist / 150);
            Matter.Body.applyForce(candyBody, candyPos, {
              x: cushion.direction.x * forceMagnitude,
              y: cushion.direction.y * forceMagnitude,
            });
          }
        }
      }
    }
  });

  return entities;
};

export const CheckSpikeCollision = (
  entities: GameEntities,
  { dispatch }: SystemArgs
): GameEntities => {
  const candy = entities.candy;
  if (!candy) return entities;

  const candyPos = candy.body.position;

  // Check all spikes
  Object.keys(entities).forEach(key => {
    if (key.startsWith('spike')) {
      const spike = entities[key] as Spike;
      if (spike) {
        // Simple AABB collision with some padding for the triangular spikes
        const inX = candyPos.x > spike.position.x &&
                   candyPos.x < spike.position.x + spike.width;
        const inY = candyPos.y > spike.position.y - 10 &&
                   candyPos.y < spike.position.y + spike.height;

        if (inX && inY) {
          dispatch({ type: 'spike-hit' });
        }
      }
    }
  });

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

  // Check lose condition: candy goes off sides
  if (candyPos.x < -100 || candyPos.x > SCREEN_WIDTH + 100) {
    dispatch({ type: 'game-lost' });
  }

  return entities;
};
