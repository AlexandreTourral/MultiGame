"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeck = buildDeck;
exports.shuffle = shuffle;
const uuid_1 = require("uuid");
// 45 cartes jouables (hors cartes Aide de jeu) :
// SOUTIEN  : 4 types, quantité = valeur → 5+6+7+8 = 26 cartes
// ALLIANCE : 7 cartes (+1×3, +2×2, +3×2)
// TRAHISON : 9 cartes (-1×3, -2×3, -3×3)
// VILLE    : 3 cartes
// Total    : 26 + 7 + 9 + 3 = 45 ✓
const SOUTIEN_COUNTS = [
    { type: 'INFORMATEUR', count: 5 },
    { type: 'PICKPOCKET', count: 6 },
    { type: 'SBIRE', count: 7 },
    { type: 'CAID', count: 8 },
];
function buildDeck() {
    const cards = [];
    for (const { type, count } of SOUTIEN_COUNTS) {
        for (let i = 0; i < count; i++) {
            cards.push({ id: (0, uuid_1.v4)(), type: 'SOUTIEN', soutienType: type });
        }
    }
    // 7 ALLIANCE : 3×(+2), 2×(+3), 2×(+4)
    for (let i = 0; i < 3; i++)
        cards.push({ id: (0, uuid_1.v4)(), type: 'ALLIANCE', pointValue: 2 });
    for (let i = 0; i < 2; i++)
        cards.push({ id: (0, uuid_1.v4)(), type: 'ALLIANCE', pointValue: 3 });
    for (let i = 0; i < 2; i++)
        cards.push({ id: (0, uuid_1.v4)(), type: 'ALLIANCE', pointValue: 4 });
    // 9 TRAHISON : 3×(-1), 3×(-2), 3×(-3)
    for (let i = 0; i < 3; i++)
        cards.push({ id: (0, uuid_1.v4)(), type: 'TRAHISON', pointValue: -1 });
    for (let i = 0; i < 3; i++)
        cards.push({ id: (0, uuid_1.v4)(), type: 'TRAHISON', pointValue: -2 });
    for (let i = 0; i < 3; i++)
        cards.push({ id: (0, uuid_1.v4)(), type: 'TRAHISON', pointValue: -3 });
    // 3 VILLE
    cards.push({ id: (0, uuid_1.v4)(), type: 'VILLE' });
    cards.push({ id: (0, uuid_1.v4)(), type: 'VILLE' });
    cards.push({ id: (0, uuid_1.v4)(), type: 'VILLE' });
    return shuffle(cards);
}
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
