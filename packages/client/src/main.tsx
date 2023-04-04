import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

import { clusterApiUrl } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'

function AppContainer() {
  const solanaEndpoint = useMemo(() => "https://rpc-devnet.helius.xyz/?api-key=deaec5f3-f4bb-4702-967c-48b9b7e5a951", [])
  const solanaWallets = useMemo(() => [
    new BackpackWalletAdapter(),
    new PhantomWalletAdapter(),
  ], [solanaEndpoint])

  return (
    <ConnectionProvider endpoint={solanaEndpoint}>
      <WalletProvider wallets={solanaWallets} autoConnect={true}>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
.render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>,
)
