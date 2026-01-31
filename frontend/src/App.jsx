import './App.css';
import CraftPredictor from './components/CraftPredictor';
import VoiceSearch from './components/VoiceSearch';

function App() {
  return (
    <div className="app">
      <VoiceSearch />
      <div className="section-divider"></div>
      <CraftPredictor />
    </div>
  );
}

export default App;
