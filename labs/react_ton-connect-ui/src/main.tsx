import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {TonConnectUIProvider} from "@tonconnect/ui-react";

// mock
const manifestUrl = 'https://raw.githubusercontent.com/ton-community/tutorials/main/03-client/test/public/tonconnect-manifest.json';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* we cant change options in provider, we should use setter from tonconnect-ui */}
    <TonConnectUIProvider manifestUrl={manifestUrl} language="en" uiPreferences={{ theme: "SYSTEM" }}>
      <App/>
    </TonConnectUIProvider>
  </React.StrictMode>,
)
