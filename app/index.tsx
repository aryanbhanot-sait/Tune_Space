import React, { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import Home from './Home';
import Settings from './Settings';

export default function DefaultPage() {
  const [screen, setScreen] = useState<'signin' | 'signup' | 'home' | 'settings'>('signin');
  const [userId, setUserId] = useState<string | null>(null);

  if (screen === 'signup') return <SignUp onSignIn={() => setScreen('signin')} />;
  if (screen === 'home') return <Home 
    userId={userId} 
    onLogout={() => { setScreen('signin'); setUserId(null); }} 
    goSettings={() => setScreen('settings')}
  />;
  if (screen === 'settings') return <Settings 
    userId={userId}
    onBack={() => setScreen('home')} 
    onSignOut={() => { setScreen('signin'); setUserId(null); }}
  />;
  return <SignIn 
    onSignUp={() => setScreen('signup')}
    onSignedIn={userId => { setUserId(userId); setScreen('home'); }}
  />;
}
