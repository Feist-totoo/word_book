export const palette = {
  green:     '#2ed573',
  greenDark: '#26b85f',
  greenMuted:'#e8fdf2',
  red:       '#ff7675',
  orange:    '#ffa502',
  blue:      '#74b9ff',
  blueMuted: '#eaf6ff',
};

export const light = {
  // backgrounds
  bg:         '#f5f6f8',
  card:       '#ffffff',
  cardAlt:    '#f9fafb',
  border:     '#f0f0f0',
  borderMid:  '#e0e0e0',

  // text
  text:       '#1a1a2e',
  textSub:    '#555555',
  textMuted:  '#999999',
  textFaint:  '#cccccc',

  // accents (same in both modes)
  primary:    palette.green,
  primaryDark:palette.greenDark,
  primaryBg:  palette.greenMuted,
  danger:     palette.red,
  warning:    palette.orange,
  info:       palette.blue,
  infoBg:     palette.blueMuted,

  // tab bar
  tabBar:     '#ffffff',
  tabBorder:  '#f0f0f0',

  // status bar style
  statusBar:  'dark',
};

export const dark = {
  bg:         '#0f0f14',
  card:       '#1c1c24',
  cardAlt:    '#14141c',
  border:     '#2a2a38',
  borderMid:  '#3a3a4a',

  text:       '#f0f0f8',
  textSub:    '#b0b0c8',
  textMuted:  '#6a6a88',
  textFaint:  '#3a3a50',

  primary:    palette.green,
  primaryDark:palette.greenDark,
  primaryBg:  '#0d2a1a',
  danger:     palette.red,
  warning:    palette.orange,
  info:       palette.blue,
  infoBg:     '#0a1a2e',

  tabBar:     '#1c1c24',
  tabBorder:  '#2a2a38',

  statusBar:  'light',
};
