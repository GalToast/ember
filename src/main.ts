import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;

// offline after first load — register whenever the browser supports it (secure contexts only, which
// includes http://localhost and the phone-served http://localhost:8080 route)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
