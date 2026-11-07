import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;

// offline after first load
if ('serviceWorker' in navigator && location.protocol !== 'http:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
