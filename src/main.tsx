
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/globals.css'
import { AuthProvider } from './components/auth-context'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
  