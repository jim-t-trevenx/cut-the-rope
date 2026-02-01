import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { CandyRenderer, MonsterRenderer, AnchorRenderer, RopeRenderer, CutRopeSegmentRenderer, CutSparkRenderer } from './renderer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CANDY_RADIUS = 25;
export const MONSTER_RADIUS = 40;
export const ANCHOR_RADIUS = 8;

export interface Anchor {
  id: string;
  position: { x: number; y: number };
  renderer: typeof AnchorRenderer;
}

export interface Candy {
  body: Matter.Body;
  radius: number;
  renderer: typeof CandyRenderer;
}

export interface Rope {
  id: string;
  constraint: Matter.Constraint;
  anchorId: string;
  renderer: typeof RopeRenderer;
}

export interface Monster {
  position: { x: number; y: number };
  radius: number;
  renderer: typeof MonsterRenderer;
}

export interface CutRopeSegment {
  id: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  recoilDirection: 'up' | 'down';
  createdAt: number;
  renderer: typeof CutRopeSegmentRenderer;
}

export interface CutSpark {
  id: string;
  position: { x: number; y: number };
  createdAt: number;
  renderer: typeof CutSparkRenderer;
}

export interface GameEntities {
  physics: { engine: Matter.Engine; world: Matter.World };
  candy: Candy;
  monster: Monster;
  [key: string]: any;
}

export function createEntities(engine: Matter.Engine): GameEntities {
  const world = engine.world;

  // Anchor positions - closer together so ropes can reach
  const anchor1Pos = { x: SCREEN_WIDTH / 2 - 50, y: 120 };
  const anchor2Pos = { x: SCREEN_WIDTH / 2 + 50, y: 120 };

  // Candy starts below anchors
  const candyStartX = SCREEN_WIDTH / 2;
  const candyStartY = 250;

  // Calculate rope lengths based on actual distance
  const rope1Length = Math.sqrt(
    Math.pow(candyStartX - anchor1Pos.x, 2) + Math.pow(candyStartY - anchor1Pos.y, 2)
  );
  const rope2Length = Math.sqrt(
    Math.pow(candyStartX - anchor2Pos.x, 2) + Math.pow(candyStartY - anchor2Pos.y, 2)
  );

  // Create candy body (dynamic, affected by physics)
  const candyBody = Matter.Bodies.circle(
    candyStartX,
    candyStartY,
    CANDY_RADIUS,
    {
      restitution: 0.4,
      friction: 0.1,
      frictionAir: 0.005, // Lower air friction for realistic falling
      density: 0.001, // Light candy
      label: 'candy',
    }
  );
  Matter.World.add(world, candyBody);

  // Create anchor points
  const anchor1: Anchor = {
    id: 'anchor1',
    position: anchor1Pos,
    renderer: AnchorRenderer,
  };

  const anchor2: Anchor = {
    id: 'anchor2',
    position: anchor2Pos,
    renderer: AnchorRenderer,
  };

  // Create rope constraints with correct lengths
  const rope1Constraint = Matter.Constraint.create({
    pointA: { x: anchor1Pos.x, y: anchor1Pos.y },
    bodyB: candyBody,
    stiffness: 0.9, // Tighter rope
    damping: 0.05, // Less damping for natural swing
    length: rope1Length,
    label: 'rope1',
  });

  const rope2Constraint = Matter.Constraint.create({
    pointA: { x: anchor2Pos.x, y: anchor2Pos.y },
    bodyB: candyBody,
    stiffness: 0.9, // Tighter rope
    damping: 0.05, // Less damping for natural swing
    length: rope2Length,
    label: 'rope2',
  });

  Matter.World.add(world, [rope1Constraint, rope2Constraint]);

  const rope1: Rope = {
    id: 'rope1',
    constraint: rope1Constraint,
    anchorId: 'anchor1',
    renderer: RopeRenderer,
  };

  const rope2: Rope = {
    id: 'rope2',
    constraint: rope2Constraint,
    anchorId: 'anchor2',
    renderer: RopeRenderer,
  };

  // Create monster (goal zone)
  const monster: Monster = {
    position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 },
    radius: MONSTER_RADIUS,
    renderer: MonsterRenderer,
  };

  // Create candy entity
  const candy: Candy = {
    body: candyBody,
    radius: CANDY_RADIUS,
    renderer: CandyRenderer,
  };

  return {
    physics: { engine, world },
    candy,
    monster,
    anchor1,
    anchor2,
    rope1,
    rope2,
  };
}
