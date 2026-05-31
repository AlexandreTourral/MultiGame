import { Link } from 'react-router-dom';
import { GAMES } from '../games/registry';
import '../styles/landing.css';

export function LandingPage() {
  return (
    <div className="landing-screen">
      <header className="landing-hero">
        <h1 className="landing-title">MULTI<span>GAME</span></h1>
        <p className="landing-subtitle">Bibliothèque de jeux en ligne</p>
      </header>

      <div className="landing-grid">
        {GAMES.map((game) =>
          game.available ? (
            <Link key={game.id} to={game.path} className="game-card game-card--available">
              <div className="game-card__header">
                <h2 className="game-card__title">{game.title}</h2>
                {game.tags && (
                  <div className="game-card__tags">
                    {game.tags.map((tag) => (
                      <span key={tag} className="game-card__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="game-card__subtitle">{game.subtitle}</p>
              <span className="game-card__cta">Jouer →</span>
            </Link>
          ) : (
            <div key={game.id} className="game-card game-card--unavailable">
              <div className="game-card__header">
                <h2 className="game-card__title">{game.title}</h2>
                <span className="game-card__badge">Bientôt disponible</span>
              </div>
              <p className="game-card__subtitle">{game.subtitle}</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
