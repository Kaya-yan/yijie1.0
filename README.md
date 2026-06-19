# 译界 - 多语言智能聚合平台

一个集翻译、词典、语法、写作、阅读、休闲游戏和 AI 工具导航于一体的多语言聚合平台。

## 功能特性

### 核心功能
- **智能翻译** - 支持 8 种语言互译，集成多个国内大模型
- **智能词典** - AI 驱动的词典查询，提供详细释义、例句
- **语法分析** - AI 分析句子结构，讲解语法要点
- **写作训练** - 多场景写作辅助，AI 实时评分与建议
- **智能阅读** - 词汇标注、段落翻译、AI 讲解

### 娱乐功能
- **恐龙跑酷** - 经典 Chrome 离线游戏复刻

### 工具聚合
- **AI 工具聚合** - 收录 60+ 个 AI 工具，涵盖 9 个类别

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **组件库**: shadcn/ui
- **状态管理**: Zustand
- **图标**: Lucide React

## 支持的 AI 模型

| 模型 | 提供商 | 用途 |
|------|--------|------|
| Kimi | 月之暗面 | 翻译、语法、写作 |
| DeepSeek | 深度求索 | 翻译、语法、写作 |
| 通义千问 | 阿里云 | 翻译、语法、写作 |
| 文心一言 | 百度 | 翻译、语法、写作 |
| 智谱清言 | 清华 | 翻译、语法、写作 |
| 讯飞星火 | 科大讯飞 | 翻译、语法、写作 |
| 自定义模型 | 用户配置 | 灵活接入 |

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000，输入默认密码 `20250304` 即可进入平台。

### 配置 API

1. 登录后进入「设置」页面
2. 选择一个模型，填入 API Key
3. 点击「测试连接」验证配置
4. 保存配置后即可使用 AI 功能

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```


## 项目结构

```
my-app/
├── src/
│   ├── app/                    # 页面路由
│   │   ├── page.tsx           # 登录页
│   │   ├── dashboard/         # 翻译首页
│   │   ├── dictionary/        # 词典
│   │   ├── grammar/           # 语法
│   │   ├── writing/           # 写作
│   │   ├── reading/           # 阅读
│   │   ├── game/              # 游戏
│   │   ├── tools/             # 工具
│   │   └── settings/          # API 设置
│   ├── components/            # 组件库
│   │   ├── ui/                # shadcn/ui 组件
│   │   └── Navbar.tsx         # 导航栏
│   ├── lib/                   # 工具函数
│   │   ├── api/               # API 调用层
│   │   │   └── client.ts      # 统一 API 客户端
│   │   ├── store.ts           # Zustand 状态管理
│   │   └── utils.ts           # 工具函数
│   └── hooks/                 # 自定义 hooks
├── public/                    # 静态资源
├── vercel.json                # Vercel 部署配置
└── package.json               # 项目配置
```

## 功能亮点

### 优雅降级
未配置 API 时，系统自动使用本地 mock 数据，保证基本功能可用。

### 响应式设计
完美适配桌面端和移动端，提供一致的用户体验。

### 数据持久化
使用 Zustand + localStorage 持久化用户配置、翻译历史、生词本等数据。

### 现代化 UI
参考 Reverso Context 设计风格，使用 shadcn/ui 组件库，提供专业的视觉体验。

## 许可证

MIT License
