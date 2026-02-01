import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Matter from 'matter-js';

// Constants (duplicated to avoid circular dependency)
const ANCHOR_RADIUS = 8;

interface CandyProps {
  body: Matter.Body;
  radius: number;
}

export const CandyRenderer: React.FC<CandyProps> = ({ body, radius }) => {
  const x = body.position.x - radius;
  const y = body.position.y - radius;
  const wrapperWidth = radius * 0.6;

  return (
    <View
      style={[
        styles.candyContainer,
        {
          left: x - wrapperWidth,
          top: y,
          width: radius * 2 + wrapperWidth * 2,
          height: radius * 2,
        },
      ]}
    >
      {/* Left wrapper end */}
      <View style={[styles.wrapperEnd, styles.wrapperLeft]}>
        <View style={styles.wrapperFold} />
        <View style={[styles.wrapperFold, { transform: [{ rotate: '60deg' }] }]} />
        <View style={[styles.wrapperFold, { transform: [{ rotate: '-60deg' }] }]} />
      </View>

      {/* Main candy body */}
      <View
        style={[
          styles.candy,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
          },
        ]}
      >
        {/* Gradient layers */}
        <View style={[styles.candyGradientTop, { borderRadius: radius }]} />
        <View style={[styles.candyGradientBottom, { borderRadius: radius }]} />

        {/* Shine highlight */}
        <View style={styles.candyShine} />

        {/* Stripes */}
        <View style={styles.candyStripe} />
        <View style={[styles.candyStripe, { top: '60%' }]} />
      </View>

      {/* Right wrapper end */}
      <View style={[styles.wrapperEnd, styles.wrapperRight]}>
        <View style={styles.wrapperFold} />
        <View style={[styles.wrapperFold, { transform: [{ rotate: '60deg' }] }]} />
        <View style={[styles.wrapperFold, { transform: [{ rotate: '-60deg' }] }]} />
      </View>
    </View>
  );
};

interface MonsterProps {
  position: { x: number; y: number };
  radius: number;
}

export const MonsterRenderer: React.FC<MonsterProps> = ({ position, radius }) => {
  const x = position.x - radius;
  const y = position.y - radius;

  return (
    <View
      style={[
        styles.monsterContainer,
        {
          left: x - 15,
          top: y - 10,
          width: radius * 2 + 30,
          height: radius * 2 + 20,
        },
      ]}
    >
      {/* Left arm */}
      <View style={[styles.arm, styles.armLeft]} />

      {/* Main body */}
      <View
        style={[
          styles.monster,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
          },
        ]}
      >
        {/* Body gradient highlight */}
        <View style={[styles.monsterHighlight, { borderRadius: radius }]} />

        {/* Eyes */}
        <View style={styles.eyeContainer}>
          <View style={styles.eye}>
            <View style={styles.pupil} />
            <View style={styles.eyeShine} />
          </View>
          <View style={styles.eye}>
            <View style={styles.pupil} />
            <View style={styles.eyeShine} />
          </View>
        </View>

        {/* Mouth with teeth */}
        <View style={styles.mouth}>
          {/* Teeth */}
          <View style={styles.teethRow}>
            <View style={styles.tooth} />
            <View style={styles.tooth} />
            <View style={styles.tooth} />
            <View style={styles.tooth} />
          </View>
          {/* Tongue */}
          <View style={styles.tongue} />
        </View>
      </View>

      {/* Right arm */}
      <View style={[styles.arm, styles.armRight]} />
    </View>
  );
};

interface AnchorProps {
  position: { x: number; y: number };
}

export const AnchorRenderer: React.FC<AnchorProps> = ({ position }) => {
  return (
    <View
      style={[
        styles.anchorContainer,
        {
          left: position.x - 12,
          top: position.y - 8,
        },
      ]}
    >
      {/* Mounting plate */}
      <View style={styles.mountingPlate}>
        <View style={styles.mountingScrew} />
        <View style={[styles.mountingScrew, { right: 2 }]} />
      </View>

      {/* Hook body */}
      <View style={styles.hookBody}>
        <View style={styles.hookHighlight} />
      </View>

      {/* Hook curve */}
      <View style={styles.hookCurve} />
    </View>
  );
};

interface RopeProps {
  constraint: Matter.Constraint;
  anchorId: string;
  entities?: any; // Passed by GameEngine
}

export const RopeRenderer: React.FC<RopeProps> = ({
  constraint,
  anchorId,
  entities
}) => {
  if (!constraint || !entities) return null;

  const candy = entities.candy;
  const anchor = entities[anchorId];
  if (!anchor || !candy) return null;

  const startX = anchor.position.x;
  const startY = anchor.position.y;
  const endX = candy.body.position.x;
  const endY = candy.body.position.y;

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Generate braided segments
  const segmentWidth = 8;
  const numSegments = Math.ceil(length / segmentWidth);

  return (
    <View
      style={[
        styles.ropeContainer,
        {
          left: startX,
          top: startY - 3,
          width: length,
          transform: [{ rotate: `${angle}deg` }],
          transformOrigin: 'left center',
        },
      ]}
    >
      {/* Shadow */}
      <View style={[styles.ropeShadow, { width: length }]} />

      {/* Braided rope segments */}
      <View style={styles.ropeInner}>
        {Array.from({ length: numSegments }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.ropeSegment,
              i % 2 === 0 ? styles.ropeSegmentLight : styles.ropeSegmentDark,
            ]}
          />
        ))}
      </View>

      {/* Rope highlight */}
      <View style={[styles.ropeHighlight, { width: length }]} />
    </View>
  );
};

// Cut rope segment with recoil animation and frayed end
interface CutRopeSegmentProps {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  recoilDirection: 'up' | 'down';
  onAnimationComplete?: () => void;
}

export const CutRopeSegmentRenderer: React.FC<CutRopeSegmentProps> = ({
  startPoint,
  endPoint,
  recoilDirection,
  onAnimationComplete,
}) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const recoil = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run recoil and fade animations in parallel
    Animated.parallel([
      Animated.spring(recoil, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete?.();
    });
  }, []);

  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Recoil offset based on direction
  const recoilDistance = recoilDirection === 'up' ? -20 : 20;
  const translateY = recoil.interpolate({
    inputRange: [0, 1],
    outputRange: [0, recoilDistance],
  });

  return (
    <Animated.View
      style={[
        styles.cutRopeSegment,
        {
          left: startPoint.x,
          top: startPoint.y,
          width: length,
          opacity,
          transform: [
            { rotate: `${angle}deg` },
            { translateY },
          ],
          transformOrigin: 'left center',
        },
      ]}
    >
      {/* Frayed end - jagged lines */}
      <View style={styles.frayedEnd}>
        <View style={[styles.frayLine, { transform: [{ rotate: '-30deg' }] }]} />
        <View style={[styles.frayLine, { transform: [{ rotate: '0deg' }] }]} />
        <View style={[styles.frayLine, { transform: [{ rotate: '30deg' }] }]} />
      </View>
    </Animated.View>
  );
};

// Spark particles at cut point
interface CutSparkProps {
  position: { x: number; y: number };
  onAnimationComplete?: () => void;
}

export const CutSparkRenderer: React.FC<CutSparkProps> = ({
  position,
  onAnimationComplete,
}) => {
  const animations = useRef(
    Array.from({ length: 6 }, () => ({
      opacity: new Animated.Value(1),
      translate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animationPromises = animations.map((anim) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translate, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel(animationPromises).start(() => {
      onAnimationComplete?.();
    });
  }, []);

  // 6 particles spread in different directions
  const particleAngles = [0, 60, 120, 180, 240, 300];
  const spreadDistance = 25;

  return (
    <View style={[styles.sparkContainer, { left: position.x, top: position.y }]}>
      {animations.map((anim, index) => {
        const angleRad = (particleAngles[index] * Math.PI) / 180;
        const translateX = anim.translate.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angleRad) * spreadDistance],
        });
        const translateY = anim.translate.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angleRad) * spreadDistance],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.sparkParticle,
              {
                opacity: anim.opacity,
                transform: [{ translateX }, { translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  candyContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  candy: {
    backgroundColor: '#FF6B35',
    borderWidth: 3,
    borderColor: '#E55A2B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  candyGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#FF8C5A',
    opacity: 0.6,
  },
  candyGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#D44A1A',
    opacity: 0.4,
  },
  candyShine: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 12,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 6,
    transform: [{ rotate: '-30deg' }],
  },
  candyStripe: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  wrapperEnd: {
    width: 15,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapperLeft: {
    marginRight: -2,
  },
  wrapperRight: {
    marginLeft: -2,
  },
  wrapperFold: {
    position: 'absolute',
    width: 12,
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 1,
  },
  monsterContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monster: {
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#388E3C',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  monsterHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#66BB6A',
    opacity: 0.5,
  },
  arm: {
    width: 12,
    height: 25,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#388E3C',
  },
  armLeft: {
    marginRight: -5,
    transform: [{ rotate: '20deg' }],
  },
  armRight: {
    marginLeft: -5,
    transform: [{ rotate: '-20deg' }],
  },
  eyeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -8,
  },
  eye: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 10,
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    marginTop: 2,
  },
  eyeShine: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  mouth: {
    width: 35,
    height: 20,
    backgroundColor: '#8B0000',
    borderRadius: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginTop: 4,
    overflow: 'hidden',
    alignItems: 'center',
  },
  teethRow: {
    flexDirection: 'row',
    gap: 2,
  },
  tooth: {
    width: 6,
    height: 6,
    backgroundColor: 'white',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tongue: {
    position: 'absolute',
    bottom: 2,
    width: 14,
    height: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 7,
  },
  anchorContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  mountingPlate: {
    width: 24,
    height: 8,
    backgroundColor: '#5D4E37',
    borderRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  mountingScrew: {
    width: 4,
    height: 4,
    backgroundColor: '#8B7355',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#3D2E17',
  },
  hookBody: {
    width: 6,
    height: 12,
    backgroundColor: '#B8860B',
    borderWidth: 1,
    borderColor: '#8B6914',
    overflow: 'hidden',
  },
  hookHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#DAA520',
  },
  hookCurve: {
    width: 10,
    height: 10,
    borderWidth: 3,
    borderColor: '#B8860B',
    borderRadius: 5,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
    marginLeft: 4,
  },
  anchor: {
    position: 'absolute',
    backgroundColor: '#666',
    borderWidth: 2,
    borderColor: '#444',
  },
  ropeContainer: {
    position: 'absolute',
    height: 10,
  },
  ropeInner: {
    flexDirection: 'row',
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
  },
  ropeSegment: {
    width: 8,
    height: 6,
  },
  ropeSegmentLight: {
    backgroundColor: '#D2691E',
  },
  ropeSegmentDark: {
    backgroundColor: '#8B4513',
  },
  ropeShadow: {
    position: 'absolute',
    top: 4,
    left: 2,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
  },
  ropeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
  },
  rope: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#8B4513',
  },
  cutRopeSegment: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  frayedEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -2,
  },
  frayLine: {
    width: 6,
    height: 2,
    backgroundColor: '#A0522D',
    marginHorizontal: -1,
  },
  sparkContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  sparkParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginLeft: -3,
    marginTop: -3,
  },
});
