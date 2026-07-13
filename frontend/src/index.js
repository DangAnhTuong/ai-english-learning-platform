import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { Provider } from 'react-redux';
import { store } from './redux/store';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // Thêm HelmetProvider cho SEO

import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <HelmetProvider>
      <GoogleOAuthProvider clientId="151027052858-mmdiucsj3s8ddkmfk0rieanmhojts1np.apps.googleusercontent.com">
        <BrowserRouter> 
          <App />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </HelmetProvider>
  </Provider>
);

reportWebVitals();