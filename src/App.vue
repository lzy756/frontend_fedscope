<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
  DownOutlined,
  TableOutlined, // 引入TableOutlined图标
  ClusterOutlined, // 引入ClusterOutlined图标
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const selectedKeys = ref(['dashboard'])

const menuItems = [
  {
    key: 'dashboard',
    icon: DashboardOutlined,
    title: '仪表盘',
    path: '/dashboard'
  },
  {
    key: 'experiments',
    icon: ExperimentOutlined,
    title: '实验管理',
    path: '/experiments'
  },
  {
    key: 'models',
    icon: DatabaseOutlined,
    title: '模型管理',
    path: '/models'
  },
  {
    key: 'datasets',
    icon: TableOutlined, // 使用TableOutlined图标
    title: '数据集管理',
    path: '/datasets'
  },
  // {
  //   key: 'cluster-fedsak',
  //   icon: ClusterOutlined, // 使用ClusterOutlined图标
  //   title: '训练过程可视化',
  //   path: '/cluster-fedsak'
  // },
  {
    key: 'participants',
    icon: TeamOutlined,
    title: '参与方管理',
    path: '/participants'
  },
  {
    key: 'settings',
    icon: SettingOutlined,
    title: '系统设置',
    path: '/settings'
  }
]

// 根据路径获取菜单key的函数
const getMenuKeyFromPath = (path) => {
  const item = menuItems.find(item => item.path === path)
  return item ? item.key : 'dashboard'
}

// 更新菜单选中状态
const updateSelectedKeys = () => {
  const currentPath = route.path
  const menuKey = getMenuKeyFromPath(currentPath)
  selectedKeys.value = [menuKey]
}

// 监听路由变化
watch(() => route.path, () => {
  updateSelectedKeys()
}, { immediate: true })

// 组件挂载时初始化选中状态
onMounted(() => {
  updateSelectedKeys()
})

// 处理菜单点击事件
const handleMenuClick = ({ key }) => {
  const item = menuItems.find(item => item.key === key)
  if (item) {
    router.push(item.path)
  }
}
</script>

<template>
  <a-layout class="app-layout">
    <!-- 侧边栏 -->
    <a-layout-sider 
      v-model:collapsed="collapsed" 
      :trigger="null" 
      collapsible
      theme="dark"
      class="app-sider"
    >
      <!-- Logo区域 -->
      <div class="logo">
        <img v-if="!collapsed" src="./assets/logo.png" alt="FederatedScope" class="logo-img" />
        <img v-else src="./assets/logo.png" alt="FS" class="logo-img-collapsed" />
        <span v-if="!collapsed" class="logo-text">跨域训练管理页面</span>
      </div>
      
      <!-- 菜单 -->
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        class="app-menu"
        @click="handleMenuClick"
      >
        <a-menu-item 
          v-for="item in menuItems" 
          :key="item.key"
        >
          <component :is="item.icon" />
          <span>{{ item.title }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout class="app-content-layout">
      <!-- 顶部导航 -->
      <a-layout-header class="app-header">
        <div class="header-left">
          <a-button
            type="text"
            @click="collapsed = !collapsed"
            class="trigger"
          >
            <component :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined" />
          </a-button>
          <span class="page-title">联邦学习管理平台</span>
        </div>
        
        <div class="header-right">
          <a-space>
            <a-badge :count="5">
              <a-button type="text" shape="circle">
                <template #icon>
                  <BellOutlined />
                </template>
              </a-button>
            </a-badge>
            
            <a-dropdown>
              <a-button type="text">
                <a-avatar size="small" style="background-color: #1890ff;">
                  Admin
                </a-avatar>
                <DownOutlined style="margin-left: 8px;" />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="profile">个人资料</a-menu-item>
                  <a-menu-item key="settings">设置</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout">退出登录</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-layout-header>

      <!-- 主内容区域 -->
      <a-layout-content class="app-main">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-sider {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  height: 100vh;
  z-index: 1000;
}

.logo {
  height: 64px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: rgba(255, 255, 255, 0.1);
  margin: 14px;
  border-radius: 8px;
}

.logo-img {
  height: 45px;
  width: 45px;
  /* margin-right: 12px; */
  align-self: center;
}

.logo-img-collapsed {
  height: 48px;
  width: 48px;
  align-self: center;
}

.logo-text {
  color: white;
  font-size: 14.5px;
  font-weight: 500;
  white-space: nowrap;
  /* margin-left: 3px; */
}

.app-menu {
  border-right: none;
}

.app-content-layout {
  margin-left: 200px;
  transition: margin-left 0.2s;
  min-height: 100vh;
}

.app-content-layout.collapsed {
  margin-left: 80px;
}

.app-header {
  background: white;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 999;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  line-height: normal;
  padding: 0 16px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  margin-left: 16px;
  color: #262626;
}

.header-right {
  display: flex;
  align-items: center;
}

.app-main {
  background: #f0f2f5;
  overflow: visible;
  min-height: calc(100vh - 64px);
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .app-sider {
    position: fixed;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.2s;
  }
  
  .app-sider.show {
    transform: translateX(0);
  }
  
  .app-content-layout {
    margin-left: 0 !important;
  }
  
  .page-title {
    display: none;
  }
  
  .app-header {
    padding: 0 16px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }
}

/* 当侧边栏收起时的样式 */
.app-layout :deep(.ant-layout-sider-collapsed) + .app-content-layout {
  margin-left: 80px;
}
</style>
