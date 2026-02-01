import Matter from 'matter-js';

export interface GameEngine {
  engine: Matter.Engine;
  world: Matter.World;
}

export function createGameEngine(): GameEngine {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1.8 },
  });

  // Improve solver iterations for smoother physics
  engine.positionIterations = 6;
  engine.velocityIterations = 4;

  return {
    engine,
    world: engine.world,
  };
}

export function stepEngine(engine: Matter.Engine, delta: number = 16.67): void {
  Matter.Engine.update(engine, delta);
}
