/**
 * Application Entry Point
 * 
 * This is the main entry point for the Life++ PoC frontend application.
 * It initializes React and renders the root App component into the DOM.
 * 
 * @module main
 * @description React application entry point and root component initialization
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Initialize and Render Application
 * 
 * Creates a React root and renders the App component in StrictMode for
 * additional development checks and warnings. The root element with id 'root'
 * must exist in the HTML template (index.html).
 * 
 * StrictMode helps identify potential problems by:
 * - Identifying components with unsafe lifecycles
 * - Warning about legacy string ref API usage
 * - Detecting unexpected side effects
 * - Warning about deprecated findDOMNode usage
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
