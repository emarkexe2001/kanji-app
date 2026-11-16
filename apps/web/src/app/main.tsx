import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app';

// index.html always has the #root element; if it were ever missing, say so plainly.
const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root element to draw the app in.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
