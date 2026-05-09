import { useGameStore } from '../store/gameStore';

export function HUD() {
  const { gameState, playerId, errorMessage, opponentDisconnected } = useGameStore();
  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === playerId);
  const opponent = gameState.players.find((p) => p.id !== playerId);
  const isMyTurn = gameState.currentPlayerId === playerId;

  return (
    <div className="hud">
      <div className="hud-bar">
        <div className={`player-info ${!isMyTurn ? 'active' : ''}`}>
          <span className="player-name">{opponent?.name ?? '...'}</span>
          <span className="badge">{opponent?.handCount ?? 0} cartes</span>
          {opponent?.hasTakenThisRound && <span className="badge taken">PRIS ✓</span>}
          <span className="badge actions">{opponent?.actionsRemainingThisRound ?? 0} actions</span>
        </div>

        <div className="round-display">
          <span className="round-label">MANCHE</span>
          <span className="round-num">{gameState.round}/{gameState.maxRounds}</span>
          <span className="deck-count">{gameState.deckCount} cartes</span>
        </div>

        <div className={`player-info ${isMyTurn ? 'active my-active' : ''}`}>
          <span className="player-name">{me?.name ?? '...'}</span>
          <span className="badge">{gameState.myHand.length} cartes</span>
          {me?.hasTakenThisRound && <span className="badge taken">PRIS ✓</span>}
          <span className="badge actions">{me?.actionsRemainingThisRound ?? 0} actions</span>
        </div>
      </div>

      <div className={`turn-banner ${isMyTurn ? 'my-turn' : 'opp-turn'}`}>
        {isMyTurn
          ? gameState.myHand.length > 0
            ? '🎯 Ton tour — Joue une carte ou prends les dernières'
            : '🎯 Main vide — tu dois prendre les cartes !'
          : `⏳ Tour de ${opponent?.name ?? "l'adversaire"}`}
      </div>

      {gameState.lastAction && (
        <div className="last-action-banner">{gameState.lastAction}</div>
      )}

      {opponentDisconnected && (
        <div className="disconnect-banner">
          ⚠️ Adversaire déconnecté — en attente de reconnexion...
        </div>
      )}

      {errorMessage && (
        <div className="error-toast">{errorMessage}</div>
      )}
    </div>
  );
}
