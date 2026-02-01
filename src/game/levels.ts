import { Dimensions } from 'react-native';
import { LevelData } from './entities';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const levels: LevelData[] = [
  // Level 1: Simple introduction - two ropes
  {
    id: 1,
    name: 'First Bite',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2 - 50, y: 120 },
      { id: 'anchor2', x: SCREEN_WIDTH / 2 + 50, y: 120 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
      { anchorId: 'anchor2' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2, y: 250 },
    monsterPosition: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 },
    stars: [
      { x: SCREEN_WIDTH / 2 - 80, y: 350 },
      { x: SCREEN_WIDTH / 2, y: 450 },
      { x: SCREEN_WIDTH / 2 + 80, y: 350 },
    ],
  },

  // Level 2: Offset monster
  {
    id: 2,
    name: 'Side Step',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2, y: 100 },
      { id: 'anchor2', x: SCREEN_WIDTH / 2 + 80, y: 150 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
      { anchorId: 'anchor2' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2 + 40, y: 220 },
    monsterPosition: { x: SCREEN_WIDTH / 2 - 60, y: SCREEN_HEIGHT - 150 },
    stars: [
      { x: SCREEN_WIDTH / 2 - 40, y: 320 },
      { x: SCREEN_WIDTH / 2 + 60, y: 400 },
      { x: SCREEN_WIDTH / 2 - 80, y: 480 },
    ],
  },

  // Level 3: Three ropes
  {
    id: 3,
    name: 'Triple Threat',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2 - 80, y: 100 },
      { id: 'anchor2', x: SCREEN_WIDTH / 2, y: 80 },
      { id: 'anchor3', x: SCREEN_WIDTH / 2 + 80, y: 100 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
      { anchorId: 'anchor2' },
      { anchorId: 'anchor3' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2, y: 200 },
    monsterPosition: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 },
    stars: [
      { x: SCREEN_WIDTH / 2 - 100, y: 300 },
      { x: SCREEN_WIDTH / 2, y: 380 },
      { x: SCREEN_WIDTH / 2 + 100, y: 300 },
    ],
  },

  // Level 4: Bubble level
  {
    id: 4,
    name: 'Bubble Trouble',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2, y: 120 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2, y: 220 },
    monsterPosition: { x: SCREEN_WIDTH / 2, y: 100 },
    stars: [
      { x: SCREEN_WIDTH / 2 - 60, y: 350 },
      { x: SCREEN_WIDTH / 2 + 60, y: 350 },
      { x: SCREEN_WIDTH / 2, y: 250 },
    ],
    bubbles: [
      { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 300, radius: 50 },
    ],
  },

  // Level 5: Air cushion level
  {
    id: 5,
    name: 'Wind Rider',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2 - 100, y: 120 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2 - 100, y: 220 },
    monsterPosition: { x: SCREEN_WIDTH / 2 + 80, y: SCREEN_HEIGHT - 150 },
    stars: [
      { x: SCREEN_WIDTH / 2 - 50, y: 350 },
      { x: SCREEN_WIDTH / 2 + 30, y: 400 },
      { x: SCREEN_WIDTH / 2 + 80, y: 300 },
    ],
    airCushions: [
      { x: 50, y: SCREEN_HEIGHT - 250, dirX: 1, dirY: -0.3 },
    ],
  },

  // Level 6: Spikes danger
  {
    id: 6,
    name: 'Danger Zone',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2 - 60, y: 100 },
      { id: 'anchor2', x: SCREEN_WIDTH / 2 + 60, y: 100 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
      { anchorId: 'anchor2' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2, y: 200 },
    monsterPosition: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 },
    stars: [
      { x: SCREEN_WIDTH / 2 - 80, y: 320 },
      { x: SCREEN_WIDTH / 2, y: 400 },
      { x: SCREEN_WIDTH / 2 + 80, y: 320 },
    ],
    spikes: [
      { x: 0, y: SCREEN_HEIGHT - 250, width: SCREEN_WIDTH / 3, height: 30 },
      { x: SCREEN_WIDTH * 2/3, y: SCREEN_HEIGHT - 250, width: SCREEN_WIDTH / 3, height: 30 },
    ],
  },

  // Level 7: Complex level
  {
    id: 7,
    name: 'The Gauntlet',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2, y: 80 },
      { id: 'anchor2', x: SCREEN_WIDTH / 2 + 100, y: 150 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
      { anchorId: 'anchor2' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2 + 50, y: 180 },
    monsterPosition: { x: 80, y: SCREEN_HEIGHT - 180 },
    stars: [
      { x: SCREEN_WIDTH / 2 + 80, y: 280 },
      { x: SCREEN_WIDTH / 2, y: 380 },
      { x: SCREEN_WIDTH / 2 - 80, y: 480 },
    ],
    bubbles: [
      { x: SCREEN_WIDTH / 2 - 50, y: SCREEN_HEIGHT - 350, radius: 45 },
    ],
    airCushions: [
      { x: SCREEN_WIDTH - 80, y: SCREEN_HEIGHT - 280, dirX: -1, dirY: 0 },
    ],
  },

  // Level 8: Bubble chain
  {
    id: 8,
    name: 'Bubble Path',
    anchors: [
      { id: 'anchor1', x: 80, y: 150 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
    ],
    candyStart: { x: 80, y: 250 },
    monsterPosition: { x: SCREEN_WIDTH - 80, y: SCREEN_HEIGHT - 150 },
    stars: [
      { x: 150, y: 350 },
      { x: SCREEN_WIDTH / 2, y: 280 },
      { x: SCREEN_WIDTH - 100, y: 350 },
    ],
    bubbles: [
      { x: 150, y: SCREEN_HEIGHT - 350, radius: 40 },
      { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 400, radius: 40 },
      { x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 300, radius: 40 },
    ],
  },

  // Level 9: Wind tunnel
  {
    id: 9,
    name: 'Wind Tunnel',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2, y: 100 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2, y: 200 },
    monsterPosition: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 120 },
    stars: [
      { x: 80, y: 350 },
      { x: SCREEN_WIDTH - 80, y: 350 },
      { x: SCREEN_WIDTH / 2, y: 500 },
    ],
    airCushions: [
      { x: 30, y: 400, dirX: 1, dirY: 0 },
      { x: SCREEN_WIDTH - 80, y: 400, dirX: -1, dirY: 0 },
    ],
    spikes: [
      { x: SCREEN_WIDTH / 2 - 40, y: SCREEN_HEIGHT - 200, width: 80, height: 25 },
    ],
  },

  // Level 10: Grand finale
  {
    id: 10,
    name: 'Grand Finale',
    anchors: [
      { id: 'anchor1', x: SCREEN_WIDTH / 2 - 80, y: 80 },
      { id: 'anchor2', x: SCREEN_WIDTH / 2 + 80, y: 80 },
      { id: 'anchor3', x: SCREEN_WIDTH / 2, y: 120 },
    ],
    ropes: [
      { anchorId: 'anchor1' },
      { anchorId: 'anchor2' },
      { anchorId: 'anchor3' },
    ],
    candyStart: { x: SCREEN_WIDTH / 2, y: 200 },
    monsterPosition: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 100 },
    stars: [
      { x: 60, y: 300 },
      { x: SCREEN_WIDTH / 2, y: 380 },
      { x: SCREEN_WIDTH - 60, y: 300 },
    ],
    bubbles: [
      { x: 100, y: SCREEN_HEIGHT - 350, radius: 35 },
      { x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 350, radius: 35 },
    ],
    airCushions: [
      { x: SCREEN_WIDTH / 2 - 25, y: SCREEN_HEIGHT - 280, dirX: 0, dirY: -1 },
    ],
    spikes: [
      { x: SCREEN_WIDTH / 2 - 100, y: SCREEN_HEIGHT - 180, width: 60, height: 25 },
      { x: SCREEN_WIDTH / 2 + 40, y: SCREEN_HEIGHT - 180, width: 60, height: 25 },
    ],
  },
];

export const getLevel = (id: number): LevelData | undefined => {
  return levels.find(level => level.id === id);
};

export const getTotalLevels = (): number => {
  return levels.length;
};
