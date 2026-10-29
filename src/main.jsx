import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/noto-sans-kannada';
import './styles.css';
import { seed } from './data.js';
import { AppProvider } from './ctx.jsx';
import App from './App.jsx';

class ErrorBoundary extends React.Component{
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#12304A'}}>
          <h2>Something went wrong</h2>
          <pre style={{ fontSize: '0.8rem', color: '#A9432B'}}>{this.state.error.message}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: '1rem'}}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

seed();
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App/>
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
