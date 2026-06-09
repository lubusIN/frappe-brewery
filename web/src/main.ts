import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { FrappeUI } from 'frappe-ui'
import './style.css'
import App from './App.vue'

import Home from './pages/Home.vue'
import AppListing from './pages/AppListing.vue'
import AppDetail from './pages/AppDetail.vue'
import Categories from './pages/Categories.vue'
import Submit from './pages/Submit.vue'
import Docs from './pages/Docs.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',           component: Home,       name: 'home' },
    { path: '/apps',       component: AppListing, name: 'apps' },
    { path: '/apps/:slug', component: AppDetail,  name: 'app-detail' },
    { path: '/categories', component: Categories, name: 'categories' },
    { path: '/submit',     component: Submit,     name: 'submit' },
    { path: '/docs',       component: Docs,       name: 'docs' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

const app = createApp(App)
app.use(router)
app.use(FrappeUI, { socketio: false })

app.mount('#app')
