import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, PanResponder, GestureResponderEvent } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { createGameEngine } from '../game/engine';
import { createEntities, GameEntities, Rope, Anchor, CutRopeSegment, CutSpark } from '../game/entities';
import { Physics, CheckWinLose } from '../game/systems';
import { CandyRenderer, MonsterRenderer, AnchorRenderer, RopeRenderer, CutRopeSegmentRenderer, CutSparkRenderer } from '../game/renderer';
import { linesIntersect, Line, Point } from '../utils/geometry';

type GameStatus = 'playing' | 'won' | 'lost';

function pointNearLine(point: Point, lineStart: Point, lineEnd: Point, threshold: number): boolean {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) return false;

  const param = Math.max(0, Math.min(1, dot / lenSq));

  const xx = lineStart.x + param * C;
  const yy = lineStart.y + param * D;

  const dx = point.x - xx;
  const dy = point.y - yy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return dist < threshold;
}

export const GameScreen: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [key, setKey] = useState(0);
  const [renderTick, setRenderTick] = useState(0);
  const [cutAnimations, setCutAnimations] = useState<(CutRopeSegment | CutSpark)[]>([]);
  const gameEngineRef = useRef<any>(null);
  const entitiesRef = useRef<GameEntities | null>(null);
  const lastTouchRef = useRef<Point | null>(null);
  const gameStatusRef = useRef<GameStatus>('playing');
  const animationIdRef = useRef(0);

  // Keep gameStatusRef in sync
  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  const setupEntities = useCallback(() => {
    const { engine } = createGameEngine();
    const newEntities = createEntities(engine);
    entitiesRef.current = newEntities;
    return newEntities;
  }, []);

  const [entities, setEntities] = useState<GameEntities>(() => setupEntities());

  // Cut rope function using refs so it always has latest state
  const cutRopeAtPoint = (currentPos: Point, lastPos: Point | null) => {
    const ents = entitiesRef.current;
    if (!ents || !ents.candy) {
      console.log('No entities or candy');
      return;
    }

    const { world } = ents.physics;
    const candy = ents.candy;

    const ropeKeys = Object.keys(ents).filter(k => k.startsWith('rope'));
    console.log('Checking ropes:', ropeKeys, 'at pos:', currentPos);

    for (const ropeKey of ropeKeys) {
      const rope = ents[ropeKey] as Rope;
      if (!rope || !rope.constraint) continue;

      const anchor = ents[rope.anchorId] as Anchor;
      if (!anchor) continue;

      const ropeStart = { x: anchor.position.x, y: anchor.position.y };
      const ropeEnd = {
        x: candy.body.position.x,
        y: candy.body.position.y,
      };

      console.log('Rope', ropeKey, 'from', ropeStart, 'to', ropeEnd);

      const nearRope = pointNearLine(currentPos, ropeStart, ropeEnd, 60);

      let intersects = false;
      if (lastPos) {
        const swipeLine: Line = { start: lastPos, end: currentPos };
        const ropeLine: Line = { start: ropeStart, end: ropeEnd };
        intersects = linesIntersect(swipeLine, ropeLine);
      }

      console.log('Near rope:', nearRope, 'Intersects:', intersects);

      if (nearRope || intersects) {
        console.log('CUTTING ROPE:', ropeKey);

        // Calculate cut point (project touch point onto rope line)
        const A = currentPos.x - ropeStart.x;
        const B = currentPos.y - ropeStart.y;
        const C = ropeEnd.x - ropeStart.x;
        const D = ropeEnd.y - ropeStart.y;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        const param = Math.max(0.1, Math.min(0.9, dot / lenSq));
        const cutPoint = {
          x: ropeStart.x + param * C,
          y: ropeStart.y + param * D,
        };

        // Create cut animation entities
        const now = Date.now();
        const id1 = `cutSegment-${animationIdRef.current++}`;
        const id2 = `cutSegment-${animationIdRef.current++}`;
        const sparkId = `cutSpark-${animationIdRef.current++}`;

        const upperSegment: CutRopeSegment = {
          id: id1,
          startPoint: { ...ropeStart },
          endPoint: { ...cutPoint },
          recoilDirection: 'up',
          createdAt: now,
          renderer: CutRopeSegmentRenderer,
        };

        const lowerSegment: CutRopeSegment = {
          id: id2,
          startPoint: { ...cutPoint },
          endPoint: { ...ropeEnd },
          recoilDirection: 'down',
          createdAt: now,
          renderer: CutRopeSegmentRenderer,
        };

        const spark: CutSpark = {
          id: sparkId,
          position: { ...cutPoint },
          createdAt: now,
          renderer: CutSparkRenderer,
        };

        setCutAnimations(prev => [...prev, upperSegment, lowerSegment, spark]);

        // Remove the actual rope
        Matter.World.remove(world, rope.constraint);
        delete ents[ropeKey];
        setRenderTick(n => n + 1);
      }
    }
  };

  const handleTouchStart = (evt: GestureResponderEvent) => {
    if (gameStatusRef.current !== 'playing') return;
    const { pageX, pageY } = evt.nativeEvent;
    console.log('Touch start:', pageX, pageY);
    const pos = { x: pageX, y: pageY };
    lastTouchRef.current = pos;
    cutRopeAtPoint(pos, null);
  };

  const handleTouchMove = (evt: GestureResponderEvent) => {
    if (gameStatusRef.current !== 'playing') return;
    const { pageX, pageY } = evt.nativeEvent;
    const currentPos = { x: pageX, y: pageY };
    cutRopeAtPoint(currentPos, lastTouchRef.current);
    lastTouchRef.current = currentPos;
  };

  const handleTouchEnd = () => {
    lastTouchRef.current = null;
  };

  const handleEvent = (event: { type: string }) => {
    if (event.type === 'game-won') {
      setGameStatus('won');
      gameEngineRef.current?.stop();
    } else if (event.type === 'game-lost') {
      setGameStatus('lost');
      gameEngineRef.current?.stop();
    } else if (event.type === 'frame-update') {
      // Force re-render on every physics frame for smooth animation
      setRenderTick(n => n + 1);
    }
  };

  const restartGame = () => {
    setGameStatus('playing');
    lastTouchRef.current = null;
    setCutAnimations([]);
    const newEntities = setupEntities();
    setEntities(newEntities);
    setKey(prev => prev + 1);
    setRenderTick(0);
  };

  const removeAnimation = (id: string) => {
    setCutAnimations(prev => prev.filter(anim => anim.id !== id));
  };

  const renderEntity = (entity: any, entityKey: string) => {
    if (!entity || !entity.renderer) return null;

    const currentEnts = entitiesRef.current;
    const Renderer = entity.renderer;

    // For rope, pass entities so it can access anchor and candy
    if (Renderer === RopeRenderer) {
      return (
        <RopeRenderer
          key={`${entityKey}-${renderTick}`}
          constraint={entity.constraint}
          anchorId={entity.anchorId}
          entities={currentEnts}
        />
      );
    }

    // For cut animations, pass the callback
    if (Renderer === CutRopeSegmentRenderer) {
      return (
        <CutRopeSegmentRenderer
          key={entityKey}
          startPoint={entity.startPoint}
          endPoint={entity.endPoint}
          recoilDirection={entity.recoilDirection}
          onAnimationComplete={() => removeAnimation(entity.id)}
        />
      );
    }

    if (Renderer === CutSparkRenderer) {
      return (
        <CutSparkRenderer
          key={entityKey}
          position={entity.position}
          onAnimationComplete={() => removeAnimation(entity.id)}
        />
      );
    }

    // Default: render with entity props
    return <Renderer key={`${entityKey}-${renderTick}`} {...entity} />;
  };

  const currentEntities = entitiesRef.current || entities;

  return (
    <View style={styles.container}>
      {/* Sky gradient background layers */}
      <View style={styles.skyGradientTop} />
      <View style={styles.skyGradientMiddle} />
      <View style={styles.skyGradientBottom} />

      {/* Clouds */}
      <View style={[styles.cloud, styles.cloud1]}>
        <View style={styles.cloudPuff} />
        <View style={[styles.cloudPuff, styles.cloudPuffLarge]} />
        <View style={styles.cloudPuff} />
      </View>
      <View style={[styles.cloud, styles.cloud2]}>
        <View style={styles.cloudPuff} />
        <View style={[styles.cloudPuff, styles.cloudPuffLarge]} />
        <View style={styles.cloudPuff} />
      </View>
      <View style={[styles.cloud, styles.cloud3]}>
        <View style={[styles.cloudPuff, { width: 25, height: 25 }]} />
        <View style={[styles.cloudPuff, { width: 35, height: 35 }]} />
      </View>

      {/* Grass at bottom */}
      <View style={styles.grass} />
      <View style={styles.grassDark} />

      {/* Game engine layer */}
      <GameEngine
        key={key}
        ref={gameEngineRef}
        style={StyleSheet.absoluteFill}
        systems={[Physics, CheckWinLose]}
        entities={entities}
        onEvent={handleEvent}
        running={gameStatus === 'playing'}
      >
        {Object.entries(currentEntities).map(([entityKey, entity]) =>
          renderEntity(entity, entityKey)
        )}
        {cutAnimations.map(anim => renderEntity(anim, anim.id))}
      </GameEngine>

      {/* Touch capture layer - on top */}
      {gameStatus === 'playing' && (
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
        />
      )}

      {/* Win/Lose overlay */}
      {gameStatus !== 'playing' && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.statusText}>
              {gameStatus === 'won' ? 'You Won!' : 'Try Again!'}
            </Text>
            <Text style={styles.statusEmoji}>
              {gameStatus === 'won' ? '🎉' : '😢'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={restartGame}>
              <Text style={styles.buttonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions} pointerEvents="none">
        <Text style={styles.instructionText}>
          Swipe across the ropes to cut them!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
  },
  // Sky gradient layers
  skyGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#87CEEB',
  },
  skyGradientMiddle: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#B0E0E6',
  },
  skyGradientBottom: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#E0F7FA',
  },
  // Clouds
  cloud: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cloud1: {
    top: 60,
    left: 30,
  },
  cloud2: {
    top: 100,
    right: 40,
  },
  cloud3: {
    top: 180,
    left: 100,
  },
  cloudPuff: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginHorizontal: -8,
  },
  cloudPuffLarge: {
    width: 45,
    height: 45,
    borderRadius: 23,
    marginBottom: 5,
  },
  // Grass
  grass: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#7CB342',
  },
  grassDark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#558B2F',
  },
  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFDE7',
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: '#FFD54F',
  },
  statusText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#5D4037',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusEmoji: {
    fontSize: 70,
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#66BB6A',
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 15,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#43A047',
  },
  buttonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
});
