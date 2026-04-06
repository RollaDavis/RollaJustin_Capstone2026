const makeColor = (backgroundColor, borderColor) => ({ backgroundColor, borderColor });

export const RED_EVENT_COLOR_PALETTE = [
    makeColor('rgba(254, 202, 202, 0.72)', '#ef4444'),
    makeColor('rgba(252, 165, 165, 0.72)', '#b91c1c'),
    makeColor('rgba(248, 113, 113, 0.72)', '#dc2626'),
    makeColor('rgba(239, 68, 68, 0.72)', '#991b1b'),
    makeColor('rgba(220, 38, 38, 0.72)', '#7f1d1d')
];

export const ORANGE_EVENT_COLOR_PALETTE = [
    makeColor('rgba(254, 215, 170, 0.72)', '#fb923c'),
    makeColor('rgba(253, 186, 116, 0.72)', '#c2410c'),
    makeColor('rgba(251, 146, 60, 0.72)', '#ea580c'),
    makeColor('rgba(249, 115, 22, 0.72)', '#9a3412'),
    makeColor('rgba(234, 88, 12, 0.72)', '#7c2d12')
];

// export const YELLOW_EVENT_COLOR_PALETTE = [
//     makeColor('rgba(254, 240, 138, 0.72)', '#eab308'),
//     makeColor('rgba(253, 224, 71, 0.72)', '#a16207'),
//     makeColor('rgba(250, 204, 21, 0.72)', '#ca8a04'),
//     makeColor('rgba(234, 179, 8, 0.72)', '#854d0e'),
//     makeColor('rgba(202, 138, 4, 0.72)', '#713f12')
// ];

// export const GREEN_EVENT_COLOR_PALETTE = [
//     makeColor('rgba(134, 239, 172, 0.72)', '#15803d'),
//     makeColor('rgba(74, 222, 128, 0.72)', '#16a34a'),
//     makeColor('rgba(34, 197, 94, 0.72)', '#166534'),
//     makeColor('rgba(22, 163, 74, 0.72)', '#14532d')
// ];

export const BLUE_EVENT_COLOR_PALETTE = [
    makeColor('rgba(147, 197, 253, 0.72)', '#1d4ed8'),
    makeColor('rgba(96, 165, 250, 0.72)', '#2563eb'),
    makeColor('rgba(59, 130, 246, 0.72)', '#1e3a8a'),
    makeColor('rgba(37, 99, 235, 0.72)', '#1e40af')
];

export const PURPLE_EVENT_COLOR_PALETTE = [
    makeColor('rgba(196, 181, 253, 0.72)', '#6d28d9'),
    makeColor('rgba(167, 139, 250, 0.72)', '#7c3aed'),
    makeColor('rgba(139, 92, 246, 0.72)', '#5b21b6'),
    makeColor('rgba(124, 58, 237, 0.72)', '#4c1d95')
];

export const SPRING_EVENT_COLOR_PALETTE = [
    ...BLUE_EVENT_COLOR_PALETTE,
    ...PURPLE_EVENT_COLOR_PALETTE
];

export const FALL_EVENT_COLOR_PALETTE = [
    ...RED_EVENT_COLOR_PALETTE,
    ...ORANGE_EVENT_COLOR_PALETTE
];

export const ALL_EVENT_COLOR_PALETTES = {
    red: RED_EVENT_COLOR_PALETTE,
    orange: ORANGE_EVENT_COLOR_PALETTE,
    blue: BLUE_EVENT_COLOR_PALETTE,
    purple: PURPLE_EVENT_COLOR_PALETTE
};
