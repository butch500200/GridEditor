/**
 * @fileoverview Application entry point
 *
 * Bootstraps the React application and mounts it to the DOM.
 * This is the main entry point referenced by index.html.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Mount the React application to the root element
 *
 * Uses React 18's createRoot API for concurrent rendering support.
 * StrictMode is enabled for development to catch potential issues.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
