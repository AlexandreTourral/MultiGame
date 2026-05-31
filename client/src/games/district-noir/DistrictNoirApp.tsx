import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSocketInit } from '../../socket/useSocket';
import { socket } from '../../socket/socket';
import { Lobby } from '../../components/Lobby';
import { GameBoard } from '../../components/GameBoard';
import { GameOver } from '../../components/GameOver';

export default function DistrictNoirApp() {
  useSocketInit();

  const { lobbyPhase } = useGameStore();

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

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
