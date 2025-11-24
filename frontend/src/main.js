import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import Register from './views/Register.vue'
import Results from './views/Results.vue'
import History from './views/History.vue'
import './style.css'

const routes = [
  { path: '/', component: Home },
  { path: '/register', component: Register },
  { path: '/results', component: Results },
  { path: '/history', component: History },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

createApp(App).use(router).mount('#app')
