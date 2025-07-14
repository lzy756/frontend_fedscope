import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { createRouter, createWebHistory } from 'vue-router'

// 导入路由组件
import Dashboard from './views/Dashboard.vue'
import Experiments from './views/Experiments.vue'
import Models from './views/Models.vue'
import Participants from './views/Participants.vue'
import Settings from './views/Settings.vue'
import Datasets from './views/Datasets.vue' // 导入数据集组件

// 配置路由
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard, name: 'Dashboard' },
  { path: '/experiments', component: Experiments, name: 'Experiments' },
  { path: '/models', component: Models, name: 'Models' },
  { path: '/participants', component: Participants, name: 'Participants' },
  { path: '/settings', component: Settings, name: 'Settings' },
  { path: '/datasets', component: Datasets, name: 'Datasets' } // 新增数据集页面路由
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(Antd)
app.use(router)
app.mount('#app')
