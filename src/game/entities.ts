import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { CandyRenderer, MonsterRenderer, AnchorRenderer, RopeRenderer, CutRopeSegmentRenderer, CutSparkRenderer, StarRenderer, BubbleRenderer, AirCushionRenderer, SpikeRenderer } from './renderer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CANDY_RADIUS = 25;
export const MONSTER_RADIUS = 40;
export const ANCHOR_RADIUS = 8;
export const STAR_RADIUS = 15;

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

export interface Star {
  id: string;
  position: { x: number; y: number };
  radius: number;
  collected: boolean;
  renderer: typeof StarRenderer;
}

export interface Bubble {
  id: string;
  position: { x: number; y: number };
  radius: number;
  active: boolean;
  capturedCandy: boolean;
  renderer: typeof BubbleRenderer;
}

export interface AirCushion {
  id: string;
  position: { x: number; y: number };
  direction: { x: number; y: number };
  active: boolean;
  renderer: typeof AirCushionRenderer;
}

export interface Spike {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  renderer: typeof SpikeRenderer;
}

export interface LevelData {
  id: number;
  name: string;
  anchors: { id: string; x: number; y: number }[];
  ropes: { anchorId: string }[];
  candyStart: { x: number; y: number };
  monsterPosition: { x: number; y: number };
  stars: { x: number; y: number }[];
  bubbles?: { x: number; y: number; radius: number }[];
  airCushions?: { x: number; y: number; dirX: number; dirY: number }[];
  spikes?: { x: number; y: number; width: number; height: number }[];
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

  // Create stars
  const star1: Star = {
    id: 'star1',
    position: { x: SCREEN_WIDTH / 2 - 80, y: 350 },
    radius: STAR_RADIUS,
    collected: false,
    renderer: StarRenderer,
  };

  const star2: Star = {
    id: 'star2',
    position: { x: SCREEN_WIDTH / 2, y: 450 },
    radius: STAR_RADIUS,
    collected: false,
    renderer: StarRenderer,
  };

  const star3: Star = {
    id: 'star3',
    position: { x: SCREEN_WIDTH / 2 + 80, y: 350 },
    radius: STAR_RADIUS,
    collected: false,
    renderer: StarRenderer,
  };

  return {
    physics: { engine, world },
    candy,
    monster,
    anchor1,
    anchor2,
    rope1,
    rope2,
    star1,
    star2,
    star3,
  };
}

// Create entities from level data
export function createEntitiesFromLevel(engine: Matter.Engine, level: LevelData): GameEntities {
  const world = engine.world;

  const entities: GameEntities = {
    physics: { engine, world },
    candy: null as any,
    monster: null as any,
  };

  // Create candy body
  const candyBody = Matter.Bodies.circle(
    level.candyStart.x,
    level.candyStart.y,
    CANDY_RADIUS,
    {
      restitution: 0.4,
      friction: 0.1,
      frictionAir: 0.005,
      density: 0.001,
      label: 'candy',
    }
  );
  Matter.World.add(world, candyBody);

  entities.candy = {
    body: candyBody,
    radius: CANDY_RADIUS,
    renderer: CandyRenderer,
  };

  // Create anchors and ropes
  level.anchors.forEach((anchorData, index) => {
    const anchor: Anchor = {
      id: anchorData.id,
      position: { x: anchorData.x, y: anchorData.y },
      renderer: AnchorRenderer,
    };
    entities[anchorData.id] = anchor;
  });

  level.ropes.forEach((ropeData, index) => {
    const anchor = entities[ropeData.anchorId] as Anchor;
    const ropeLength = Math.sqrt(
      Math.pow(level.candyStart.x - anchor.position.x, 2) +
      Math.pow(level.candyStart.y - anchor.position.y, 2)
    );

    const constraint = Matter.Constraint.create({
      pointA: { x: anchor.position.x, y: anchor.position.y },
      bodyB: candyBody,
      stiffness: 0.9,
      damping: 0.05,
      length: ropeLength,
      label: `rope${index + 1}`,
    });
    Matter.World.add(world, constraint);

    const rope: Rope = {
      id: `rope${index + 1}`,
      constraint,
      anchorId: ropeData.anchorId,
      renderer: RopeRenderer,
    };
    entities[`rope${index + 1}`] = rope;
  });

  // Create monster
  entities.monster = {
    position: { x: level.monsterPosition.x, y: level.monsterPosition.y },
    radius: MONSTER_RADIUS,
    renderer: MonsterRenderer,
  };

  // Create stars
  level.stars.forEach((starData, index) => {
    const star: Star = {
      id: `star${index + 1}`,
      position: { x: starData.x, y: starData.y },
      radius: STAR_RADIUS,
      collected: false,
      renderer: StarRenderer,
    };
    entities[`star${index + 1}`] = star;
  });

  // Create bubbles
  level.bubbles?.forEach((bubbleData, index) => {
    const bubble: Bubble = {
      id: `bubble${index + 1}`,
      position: { x: bubbleData.x, y: bubbleData.y },
      radius: bubbleData.radius || 40,
      active: true,
      capturedCandy: false,
      renderer: BubbleRenderer,
    };
    entities[`bubble${index + 1}`] = bubble;
  });

  // Create air cushions
  level.airCushions?.forEach((cushionData, index) => {
    const cushion: AirCushion = {
      id: `airCushion${index + 1}`,
      position: { x: cushionData.x, y: cushionData.y },
      direction: { x: cushionData.dirX, y: cushionData.dirY },
      active: true,
      renderer: AirCushionRenderer,
    };
    entities[`airCushion${index + 1}`] = cushion;
  });

  // Create spikes
  level.spikes?.forEach((spikeData, index) => {
    const spike: Spike = {
      id: `spike${index + 1}`,
      position: { x: spikeData.x, y: spikeData.y },
      width: spikeData.width,
      height: spikeData.height,
      renderer: SpikeRenderer,
    };
    entities[`spike${index + 1}`] = spike;
  });

  return entities;
}
