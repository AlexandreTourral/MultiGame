import { useGameStore } from '../store/gameStore';
import { socket } from '../socket/socket';
import { SOUTIEN_LABELS, SOUTIEN_VALUES_DISPLAY } from '../game/constants';
import type { SoutienType } from '@district-noir/shared';

const SOUTIEN_ORDER: SoutienType[] = ['INFORMATEUR', 'PICKPOCKET', 'SBIRE', 'CAID'];

export function GameOver() {
  const { gameState, playerId, winnerId, instantWin, reset } = useGameStore();
  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === playerId);
  const opponent = gameState.players.find((p) => p.id !== playerId);
  const iWon = winnerId === playerId;
  const isTie = winnerId === null;

  const handleReplay = () => {
    reset();
    // Ne pas appeler socket.disconnect() : avec autoConnect:false, aucun reconnect automatique —
    // le socket ne reviendrait jamais seul et créer/rejoindre une salle échouerait silencieusement.
    if (!socket.connected) socket.connect();
  };

  return (
    <div className="gameover-overlay">
      <div className="gameover-card">

        <div className={`gameover-result ${iWon ? 'win' : isTie ? 'tie' : 'lose'}`}>
          {instantWin
            ? iWon ? '🏙 VICTOIRE IMMÉDIATE — 3 cartes VILLE !' : '💀 DÉFAITE — L\'adversaire a réuni 3 VILLE'
            : isTie ? '🤝 ÉGALITÉ' : iWon ? '🏆 VICTOIRE' : '💀 DÉFAITE'}
        </div>

        {!instantWin && (
          <div className="soutien-grid">
            <h4>Majorités de Soutien</h4>
            <div className="soutien-rows">
              <div className="sr header">
                <span>Type</span>
                <span>{me?.name ?? 'Toi'}</span>
                <span>{opponent?.name ?? 'Adversaire'}</span>
                <span>Pts</span>
              </div>
              {SOUTIEN_ORDER.map((type) => {
                const myCount = me?.collected.filter((c) => c.type === 'SOUTIEN' && c.soutienType === type).length ?? 0;
                const oppCount = opponent?.collected.filter((c) => c.type === 'SOUTIEN' && c.soutienType === type).length ?? 0;
                const winner = myCount > oppCount ? 'me' : oppCount > myCount ? 'opp' : 'tie';
                const pts = SOUTIEN_VALUES_DISPLAY[type];

                return (
                  <div key={type} className={`sr ${winner === 'me' ? 'winner-me' : winner === 'opp' ? 'winner-opp' : 'draw'}`}>
                    <span className="type-label">{SOUTIEN_LABELS[type]} <small>({pts}pts)</small></span>
                    <span className={winner === 'me' ? 'winner-val' : ''}>{myCount}</span>
                    <span className={winner === 'opp' ? 'winner-val' : ''}>{oppCount}</span>
                    <span>{winner === 'me' ? `+${pts}` : winner === 'opp' ? `+${pts}` : '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="score-summary">
          {[me, opponent].map((p, i) => (
            p && (
              <div key={p.id} className={`score-block ${p.id === winnerId ? 'winner-block' : ''}`}>
                <div className="score-name">{p.name} {p.id === playerId ? '(toi)' : ''}</div>
                {!instantWin && p.finalScore && (
                  <div className="score-breakdown">
                    <span>Soutien: <strong>{p.finalScore.soutienScores.reduce((s, ss) => s + (ss.winner === i ? ss.value : 0), 0)}pts</strong></span>
                    {p.finalScore.serieBonus > 0 && <span>Séries: <strong>+{p.finalScore.serieBonus}pts</strong></span>}
                    {p.finalScore.alliancePoints > 0 && <span>Alliances: <strong>+{p.finalScore.alliancePoints}pts</strong></span>}
                    {p.finalScore.trahisonPoints < 0 && <span>Trahisons: <strong className="negative">{p.finalScore.trahisonPoints}pts</strong></span>}
                  </div>
                )}
                <div className="score-total">{p.score} pts</div>
              </div>
            )
          ))}
        </div>

        <button className="btn btn-primary replay-btn" onClick={handleReplay}>
          Rejouer
        </button>
      </div>
    </div>
  );
}
