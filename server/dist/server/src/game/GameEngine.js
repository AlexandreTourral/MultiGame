"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const values_1 = require("../../../shared/src/values");
const deck_1 = require("./deck");
const ACTIONS_PER_ROUND = 6;
const CARDS_PER_HAND = 5;
const INITIAL_LINE_CARDS = 2;
const TAKE_COUNT = 5;
const MAX_ROUNDS = 4;
const VILLE_WIN_COUNT = 3;
const SERIE_BONUS = 5;
const SERIE_SIZE = 4;
const SOUTIEN_TYPES = ['INFORMATEUR', 'PICKPOCKET', 'SBIRE', 'CAID'];
class GameEngine {
    state;
    constructor(roomId, player1, player2) {
        const deck = (0, deck_1.buildDeck)();
        // Remove 3 cards blind
        const removedCards = deck.splice(0, 3);
        // Deal 5 cards to each player
        const hand1 = deck.splice(0, CARDS_PER_HAND);
        const hand2 = deck.splice(0, CARDS_PER_HAND);
        // Place 2 cards in line
        const line = deck.splice(0, INITIAL_LINE_CARDS);
        this.state = {
            roomId,
            phase: 'PLAYING',
            players: [
                {
                    id: player1.id,
                    name: player1.name,
                    hand: hand1,
                    collected: [],
                    hasTakenThisRound: false,
                    actionsRemainingThisRound: ACTIONS_PER_ROUND,
                    score: 0,
                },
                {
                    id: player2.id,
                    name: player2.name,
                    hand: hand2,
                    collected: [],
                    hasTakenThisRound: false,
                    actionsRemainingThisRound: ACTIONS_PER_ROUND,
                    score: 0,
                },
            ],
            currentPlayerId: player1.id,
            line,
            deck,
            removedCards,
            round: 1,
            maxRounds: MAX_ROUNDS,
            lastAction: null,
            winner: null,
            instantWin: false,
        };
    }
    getPublicState(forPlayerId) {
        const { deck: _deck, removedCards: _removed, players, ...rest } = this.state;
        const publicPlayers = players.map((p) => ({
            id: p.id,
            name: p.name,
            handCount: p.hand.length,
            collected: p.collected,
            hasTakenThisRound: p.hasTakenThisRound,
            actionsRemainingThisRound: p.actionsRemainingThisRound,
            score: p.score,
            finalScore: p.finalScore,
        }));
        const myPlayer = players.find((p) => p.id === forPlayerId);
        return {
            ...rest,
            players: publicPlayers,
            deckCount: this.state.deck.length,
            myHand: myPlayer ? myPlayer.hand : [],
        };
    }
    applyAction(playerId, action) {
        if (this.state.phase !== 'PLAYING')
            return { success: false, error: 'La partie est terminée.' };
        if (this.state.currentPlayerId !== playerId)
            return { success: false, error: "Ce n'est pas ton tour." };
        switch (action.type) {
            case 'PLAY_CARD':
                return this.handlePlayCard(playerId, action.cardId);
            case 'TAKE_CARDS':
                return this.handleTakeCards(playerId);
            default:
                return { success: false, error: 'Action inconnue.' };
        }
    }
    handlePlayCard(playerId, cardId) {
        const player = this.getPlayer(playerId);
        if (player.hand.length === 0) {
            return { success: false, error: 'Ta main est vide, tu dois prendre les cartes.' };
        }
        const cardIndex = player.hand.findIndex((c) => c.id === cardId);
        if (cardIndex === -1)
            return { success: false, error: 'Carte introuvable dans ta main.' };
        const [card] = player.hand.splice(cardIndex, 1);
        this.state.line.push(card);
        player.actionsRemainingThisRound--;
        this.state.lastAction = `${player.name} joue une carte`;
        this.advanceTurn();
        return { success: true };
    }
    handleTakeCards(playerId) {
        const player = this.getPlayer(playerId);
        if (player.hasTakenThisRound) {
            return { success: false, error: 'Tu as déjà pris des cartes cette manche.' };
        }
        if (this.state.line.length === 0) {
            return { success: false, error: 'La ligne est vide.' };
        }
        const count = Math.min(TAKE_COUNT, this.state.line.length);
        const taken = this.state.line.splice(this.state.line.length - count, count);
        player.collected.push(...taken);
        player.hasTakenThisRound = true;
        player.actionsRemainingThisRound--;
        const villeCount = player.collected.filter((c) => c.type === 'VILLE').length;
        this.state.lastAction = `${player.name} prend ${count} carte${count > 1 ? 's' : ''} de la ligne`;
        // Instant win if player collects all VILLE cards
        if (villeCount >= VILLE_WIN_COUNT) {
            this.state.phase = 'GAME_OVER';
            this.state.winner = playerId;
            this.state.instantWin = true;
            this.state.lastAction = `${player.name} réunit les 3 cartes VILLE — Victoire immédiate !`;
            return { success: true };
        }
        this.advanceTurn();
        return { success: true };
    }
    advanceTurn() {
        const [p1, p2] = [this.state.players[0], this.state.players[1]];
        // Check round end: both players have used all actions
        if (p1.actionsRemainingThisRound <= 0 && p2.actionsRemainingThisRound <= 0) {
            this.endRound();
            return;
        }
        // Switch to next player who still has actions
        const nextPlayer = this.state.currentPlayerId === p1.id ? p2 : p1;
        if (nextPlayer.actionsRemainingThisRound <= 0) {
            // Next player has no more actions, current player continues
            return;
        }
        // Force play if hand is empty but hasn't taken (shouldn't normally happen)
        if (nextPlayer.hand.length === 0 && !nextPlayer.hasTakenThisRound && this.state.line.length === 0) {
            // Edge case: both skip, end round
            this.endRound();
            return;
        }
        this.state.currentPlayerId = nextPlayer.id;
    }
    endRound() {
        if (this.state.round >= MAX_ROUNDS || this.state.deck.length === 0) {
            this.finalizeGame();
            return;
        }
        this.state.round++;
        // Deal 5 new cards to each player
        const [p1, p2] = [this.state.players[0], this.state.players[1]];
        p1.hand = this.state.deck.splice(0, CARDS_PER_HAND);
        p2.hand = this.state.deck.splice(0, CARDS_PER_HAND);
        // Reset round state
        p1.hasTakenThisRound = false;
        p2.hasTakenThisRound = false;
        p1.actionsRemainingThisRound = ACTIONS_PER_ROUND;
        p2.actionsRemainingThisRound = ACTIONS_PER_ROUND;
        // Switch first player
        this.state.currentPlayerId =
            this.state.currentPlayerId === p1.id ? p2.id : p1.id;
        this.state.lastAction = `Manche ${this.state.round} — Nouvelle donne !`;
    }
    finalizeGame() {
        this.state.phase = 'GAME_OVER';
        const [p1, p2] = [this.state.players[0], this.state.players[1]];
        p1.finalScore = this.computeScore(p1, p2);
        p2.finalScore = this.computeScore(p2, p1);
        p1.score = p1.finalScore.total;
        p2.score = p2.finalScore.total;
        if (p1.score > p2.score) {
            this.state.winner = p1.id;
        }
        else if (p2.score > p1.score) {
            this.state.winner = p2.id;
        }
        else {
            // Tiebreaker: majority of CAÏD (value 8), then LIEUTENANT (value 6)
            this.state.winner = this.tiebreak(p1, p2);
        }
    }
    computeScore(player, opponent) {
        const soutienScores = [];
        let soutienTotal = 0;
        const playerIndex = this.state.players.indexOf(player);
        const opponentIndex = playerIndex === 0 ? 1 : 0;
        for (const type of SOUTIEN_TYPES) {
            const myCount = player.collected.filter((c) => c.type === 'SOUTIEN' && c.soutienType === type).length;
            const oppCount = opponent.collected.filter((c) => c.type === 'SOUTIEN' && c.soutienType === type).length;
            const value = values_1.SOUTIEN_VALUES[type];
            let winner = null;
            if (myCount > oppCount) {
                winner = playerIndex;
                soutienTotal += value;
            }
            else if (oppCount > myCount) {
                winner = opponentIndex;
            }
            soutienScores.push({
                type,
                value,
                counts: playerIndex === 0 ? [myCount, oppCount] : [oppCount, myCount],
                winner,
            });
        }
        // Bonus for sets of 4 different SOUTIEN types (where player has at least 1)
        const typesWithCards = SOUTIEN_TYPES.filter((t) => player.collected.some((c) => c.type === 'SOUTIEN' && c.soutienType === t)).length;
        const seriesCount = Math.floor(typesWithCards / SERIE_SIZE);
        const serieBonus = seriesCount * SERIE_BONUS;
        const alliancePoints = player.collected
            .filter((c) => c.type === 'ALLIANCE')
            .reduce((sum, c) => sum + (c.pointValue ?? 0), 0);
        const trahisonPoints = player.collected
            .filter((c) => c.type === 'TRAHISON')
            .reduce((sum, c) => sum + (c.pointValue ?? 0), 0);
        return {
            soutienScores,
            serieBonus,
            alliancePoints,
            trahisonPoints,
            total: soutienTotal + serieBonus + alliancePoints + trahisonPoints,
        };
    }
    tiebreak(p1, p2) {
        const tiebreakOrder = ['CAID', 'SBIRE', 'PICKPOCKET', 'INFORMATEUR'];
        for (const type of tiebreakOrder) {
            const c1 = p1.collected.filter((c) => c.type === 'SOUTIEN' && c.soutienType === type).length;
            const c2 = p2.collected.filter((c) => c.type === 'SOUTIEN' && c.soutienType === type).length;
            if (c1 > c2)
                return p1.id;
            if (c2 > c1)
                return p2.id;
        }
        return null;
    }
    getPlayer(playerId) {
        const player = this.state.players.find((p) => p.id === playerId);
        if (!player)
            throw new Error('Joueur introuvable');
        return player;
    }
    isGameOver() {
        return this.state.phase === 'GAME_OVER';
    }
    getWinner() {
        return this.state.winner;
    }
}
exports.GameEngine = GameEngine;
