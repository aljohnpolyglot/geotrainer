import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './cloudAuth.css';
import {cloudSync} from './services/cloudSync';
import {installDevDiagnostics} from './services/devDiagnostics';

installDevDiagnostics();
void cloudSync.start();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
