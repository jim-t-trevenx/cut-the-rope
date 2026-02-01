import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import * as Haptics from 'expo-haptics';
import { createGameEngine } from '../game/engine';
import { createEntitiesFromLevel, GameEntities, Rope, Anchor, CutRopeSegment, CutSpark, Bubble, Star, LevelData } from '../game/entities';
import { Physics, CheckWinLose, CheckStarCollection, BubbleMechanics, AirCushionMechanics, CheckSpikeCollision } from '../game/systems';
import {
  CandyRenderer,
  MonsterRenderer,
  AnchorRenderer,
  RopeRenderer,
  CutRopeSegmentRenderer,
  CutSparkRenderer,
  StarRenderer,
  BubbleRenderer,
  AirCushionRenderer,
  SpikeRenderer,
  StarCollectAnimation,
} from '../game/renderer';
import { linesIntersect, Line, Point } from '../utils/geometry';
import { getLevel } from '../game/levels';
import { saveLevelProgress, getSettings, GameSettings } from '../utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type GameStatus = 'playing' | 'won' | 'lost';

interface StarCollectAnim {
  id: string;
  startPosition: { x: number; y: number };
}

interface GameScreenProps {
  levelId: number;
  onBack: () => void;
  onNextLevel: () => void;
}

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

export const GameScreen: React.FC<GameScreenProps> = ({ levelId, onBack, onNextLevel }) => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [key, setKey] = useState(0);
  const [renderTick, setRenderTick] = useState(0);
  const [cutAnimations, setCutAnimations] = useState<(CutRopeSegment | CutSpark)[]>([]);
  const [starCollectAnims, setStarCollectAnims] = useState<StarCollectAnim[]>([]);
  const [starsCollected, setStarsCollected] = useState(0);
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
  });
  const gameEngineRef = useRef<any>(null);
  const entitiesRef = useRef<GameEntities | null>(null);
  const lastTouchRef = useRef<Point | null>(null);
  const gameStatusRef = useRef<GameStatus>('playing');
  const animationIdRef = useRef(0);
  const starsCollectedRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  useEffect(() => {
    starsCollectedRef.current = starsCollected;
  }, [starsCollected]);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await getSettings();
    setSettings(loadedSettings);
  };

  const level = getLevel(levelId);

  const setupEntities = useCallback(() => {
    if (!level) return null as any;
    const { engine } = createGameEngine();
    const newEntities = createEntitiesFromLevel(engine, level);
    entitiesRef.current = newEntities;
    return newEntities;
  }, [level]);

  const [entities, setEntities] = useState<GameEntities>(() => setupEntities());

  // Haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
    if (settings.hapticsEnabled) {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }
  };

  // Cut rope function using refs so it always has latest state
  const cutRopeAtPoint = (currentPos: Point, lastPos: Point | null) => {
    const ents = entitiesRef.current;
    if (!ents || !ents.candy) {
      return;
    }

    const { world } = ents.physics;
    const candy = ents.candy;

    const ropeKeys = Object.keys(ents).filter(k => k.startsWith('rope'));

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

      const nearRope = pointNearLine(currentPos, ropeStart, ropeEnd, 60);

      let intersects = false;
      if (lastPos) {
        const swipeLine: Line = { start: lastPos, end: currentPos };
        const ropeLine: Line = { start: ropeStart, end: ropeEnd };
        intersects = linesIntersect(swipeLine, ropeLine);
      }

      if (nearRope || intersects) {
        // Trigger haptic feedback on cut
        triggerHaptic('medium');

        // Calculate cut point
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

  // Pop bubble on tap
  const popBubble = (currentPos: Point) => {
    const ents = entitiesRef.current;
    if (!ents) return;

    const bubbleKeys = Object.keys(ents).filter(k => k.startsWith('bubble'));

    for (const bubbleKey of bubbleKeys) {
      const bubble = ents[bubbleKey] as Bubble;
      if (!bubble || !bubble.active) continue;

      const dx = currentPos.x - bubble.position.x;
      const dy = currentPos.y - bubble.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bubble.radius) {
        bubble.active = false;
        triggerHaptic('light');
        setRenderTick(n => n + 1);
        break;
      }
    }
  };

  const handleTouchStart = (evt: any) => {
    if (gameStatusRef.current !== 'playing') return;
    const { pageX, pageY } = evt.nativeEvent;
    const pos = { x: pageX, y: pageY };
    lastTouchRef.current = pos;
    cutRopeAtPoint(pos, null);
    popBubble(pos);
  };

  const handleTouchMove = (evt: any) => {
    if (gameStatusRef.current !== 'playing') return;
    const { pageX, pageY } = evt.nativeEvent;
    const currentPos = { x: pageX, y: pageY };
    cutRopeAtPoint(currentPos, lastTouchRef.current);
    lastTouchRef.current = currentPos;
  };

  const handleTouchEnd = () => {
    lastTouchRef.current = null;
  };

  const handleEvent = async (event: { type: string; starId?: string; position?: { x: number; y: number } }) => {
    if (event.type === 'game-won') {
      setGameStatus('won');
      gameEngineRef.current?.stop();
      triggerHaptic('heavy');
      // Save progress
      await saveLevelProgress(levelId, starsCollectedRef.current);
    } else if (event.type === 'game-lost') {
      setGameStatus('lost');
      gameEngineRef.current?.stop();
      triggerHaptic('heavy');
    } else if (event.type === 'spike-hit') {
      setGameStatus('lost');
      gameEngineRef.current?.stop();
      triggerHaptic('heavy');
    } else if (event.type === 'star-collected' && event.position) {
      setStarsCollected(prev => prev + 1);
      triggerHaptic('light');
      // Add star collect animation
      const animId = `starAnim-${animationIdRef.current++}`;
      setStarCollectAnims(prev => [...prev, {
        id: animId,
        startPosition: event.position!,
      }]);
    } else if (event.type === 'frame-update') {
      setRenderTick(n => n + 1);
    }
  };

  const restartGame = () => {
    setGameStatus('playing');
    setStarsCollected(0);
    starsCollectedRef.current = 0;
    lastTouchRef.current = null;
    setCutAnimations([]);
    setStarCollectAnims([]);
    const newEntities = setupEntities();
    setEntities(newEntities);
    setKey(prev => prev + 1);
    setRenderTick(0);
  };

  const removeAnimation = (id: string) => {
    setCutAnimations(prev => prev.filter(anim => anim.id !== id));
  };

  const removeStarAnim = (id: string) => {
    setStarCollectAnims(prev => prev.filter(anim => anim.id !== id));
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

    // For monster, pass entities and game status for expressions
    if (Renderer === MonsterRenderer) {
      return (
        <MonsterRenderer
          key={`${entityKey}-${renderTick}`}
          position={entity.position}
          radius={entity.radius}
          entities={currentEnts}
          gameStatus={gameStatus}
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

  if (!level) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Level not found</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      {/* Top UI */}
      <View style={styles.topUI}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.levelInfo}>
          <Text style={styles.levelName}>{level.name}</Text>
        </View>

        <View style={styles.starsUI}>
          {[0, 1, 2].map(i => (
            <Text key={i} style={[styles.starIcon, i < starsCollected && styles.starCollected]}>
              {i < starsCollected ? '★' : '☆'}
            </Text>
          ))}
        </View>
      </View>

      {/* Game engine layer */}
      <GameEngine
        key={key}
        ref={gameEngineRef}
        style={StyleSheet.absoluteFill}
        systems={[
          Physics,
          CheckStarCollection,
          BubbleMechanics,
          AirCushionMechanics,
          CheckSpikeCollision,
          CheckWinLose,
        ]}
        entities={entities}
        onEvent={handleEvent}
        running={gameStatus === 'playing'}
      >
        {Object.entries(currentEntities).map(([entityKey, entity]) =>
          renderEntity(entity, entityKey)
        )}
        {cutAnimations.map(anim => renderEntity(anim, anim.id))}
      </GameEngine>

      {/* Star collect animations */}
      {starCollectAnims.map(anim => (
        <StarCollectAnimation
          key={anim.id}
          startPosition={anim.startPosition}
          endPosition={{ x: SCREEN_WIDTH - 60, y: 70 }}
          onComplete={() => removeStarAnim(anim.id)}
        />
      ))}

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
              {gameStatus === 'won' ? 'Level Complete!' : 'Try Again!'}
            </Text>

            {gameStatus === 'won' && (
              <View style={styles.starsResult}>
                {[0, 1, 2].map(i => (
                  <Text key={i} style={[styles.resultStar, i < starsCollected && styles.resultStarCollected]}>
                    {i < starsCollected ? '★' : '☆'}
                  </Text>
                ))}
              </View>
            )}

            <Text style={styles.statusEmoji}>
              {gameStatus === 'won' ? '🎉' : '😢'}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={restartGame}>
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>

              {gameStatus === 'won' && (
                <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={onNextLevel}>
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.menuButton} onPress={onBack}>
              <Text style={styles.menuButtonText}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  // Top UI
  topUI: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backIcon: {
    fontSize: 20,
    color: '#5D4037',
  },
  levelInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  starsUI: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  starIcon: {
    fontSize: 22,
    color: '#BDBDBD',
    marginHorizontal: 2,
  },
  starCollected: {
    color: '#FFD700',
  },
  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  modal: {
    backgroundColor: '#FFFDE7',
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: '#FFD54F',
    minWidth: 280,
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5D4037',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  starsResult: {
    flexDirection: 'row',
    marginTop: 15,
  },
  resultStar: {
    fontSize: 40,
    color: '#BDBDBD',
    marginHorizontal: 5,
  },
  resultStarCollected: {
    color: '#FFD700',
  },
  statusEmoji: {
    fontSize: 50,
    marginVertical: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#66BB6A',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#43A047',
  },
  nextButton: {
    backgroundColor: '#42A5F5',
    borderColor: '#1E88E5',
    shadowColor: '#1565C0',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  menuButtonText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 24,
    color: '#5D4037',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
});
