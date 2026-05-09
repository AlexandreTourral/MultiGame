import { useGameStore } from './store/gameStore';
import { useSocketInit } from './socket/useSocket';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';

export default function App() {
  useSocketInit();

  const { lobbyPhase } = useGameStore();

  return (
    <div className="app-root">
      {(lobbyPhase === 'HOME' || lobbyPhase === 'WAITING') && <Lobby />}
      {lobbyPhase === 'PLAYING' && <GameBoard />}
      {lobbyPhase === 'GAME_OVER' && (
        <>
          <GameBoard />
          <GameOver />
        </>
      )}
    </div>
  );
}
