import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import DistrictNoirApp from './games/district-noir/DistrictNoirApp';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/district-noir/*" element={<DistrictNoirApp />} />
    </Routes>
  );
}
