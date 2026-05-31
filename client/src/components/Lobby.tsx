import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { createRoom, joinRoom, requestGameState } from '../socket/useSocket';
import { getSocketServerUrl } from '../socket/socket';

export function Lobby() {
  const { playerName, setPlayerName, errorMessage, roomId, lobbyPhase } = useGameStore();
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');

  const handleCreate = () => {
    if (!playerName.trim()) return;
    createRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    joinRoom(joinCode.trim().toUpperCase(), playerName.trim());
  };

  useEffect(() => {
    if (lobbyPhase !== 'WAITING') return;
    const timer = setTimeout(() => requestGameState(), 2000);
    return () => clearTimeout(timer);
  }, [lobbyPhase]);

  if (lobbyPhase === 'WAITING') {
    return (
      <div className="lobby-screen">
        <div className="lobby-card waiting">
          <div className="pulse-ring" />
          <h2>En attente d'un adversaire...</h2>
          <div className="room-code-display">
            <span className="label">Code de la partie</span>
            <span className="code">{roomId}</span>
          </div>
          <p className="hint">Partage ce code avec ton adversaire</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-screen">
      <Link to="/" className="library-back-link">← Bibliothèque</Link>
      <div className="lobby-hero">
        <h1 className="game-title">DISTRICT<br /><span>NOIR</span></h1>
        <p className="game-subtitle">Le jeu de cartes en ligne</p>
      </div>

      <div className="lobby-card">
        {mode === 'select' && (
          <div className="mode-select">
            <div className="input-group">
              <label>Ton nom</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ex: Scarface"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && playerName && setMode('create')}
              />
            </div>
            <div className="btn-row">
              <button
                className="btn btn-primary"
                onClick={() => setMode('create')}
                disabled={!playerName.trim()}
              >
                Créer une partie
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setMode('join')}
                disabled={!playerName.trim()}
              >
                Rejoindre
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="mode-create">
            <button className="back-btn" onClick={() => setMode('select')}>← Retour</button>
            <h3>Nouvelle partie</h3>
            <p>Tu joueras en tant que <strong>{playerName}</strong></p>
            <button className="btn btn-primary" onClick={handleCreate}>
              Créer et attendre
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="mode-join">
            <button className="back-btn" onClick={() => setMode('select')}>← Retour</button>
            <h3>Rejoindre une partie</h3>
            <div className="input-group">
              <label>Code de la partie</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={!joinCode.trim() || joinCode.length < 6}
            >
              Rejoindre
            </button>
            <p className="hint">
              Si tu joues depuis un autre appareil, ouvre la <strong>même URL</strong> que l&apos;hôte dans le
              navigateur (ex. <code>http://192.168.…:5173</code> sur le même Wi‑Fi), pas uniquement une copie locale
              de la page.
            </p>
            {import.meta.env.DEV && (
              <p className="hint" style={{ fontSize: '0.85em', opacity: 0.85 }}>
                Socket : <code>{getSocketServerUrl()}</code>
              </p>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="error-banner">{errorMessage}</div>
        )}
      </div>

      <div className="rules-summary">
        <h4>Règles rapides</h4>
        <ul>
          <li>La partie se joue en <strong>4 manches</strong>, 6 actions par joueuse par manche</li>
          <li><strong>Jouer une carte</strong> : place une carte de ta main en bout de ligne</li>
          <li><strong>Prendre les 5 dernières</strong> : récupère les 5 cartes les plus récentes de la ligne (une seule fois par manche)</li>
          <li>Si tu réunis les <strong>3 cartes VILLE</strong>, tu gagnes immédiatement !</li>
          <li>Sinon, le score final = majorité par type de <strong>Soutien</strong> + bonus séries + Alliance/Trahison</li>
        </ul>
      </div>
    </div>
  );
}
