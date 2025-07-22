import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { StoryProvider } from './contexts/StoryProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {}
    <StoryProvider>
      <App />
    </StoryProvider>
  </React.StrictMode>
);

reportWebVitals();
