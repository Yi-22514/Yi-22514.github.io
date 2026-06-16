# Yi-22514 个人博客项目简介

这是一个基于 Hexo 的个人静态博客项目，主要用于沉淀学习笔记、技术实践记录和一些带交互效果的个人页面。当前项目使用 `hexo-theme-async` 主题，并在主题配置、自定义样式和 Hexo 注入脚本上做了较多视觉与互动增强。

## 项目定位

- 站点类型：个人博客 / 在线学习笔记
- 作者信息：`Yi`
- 主要内容方向：Hexo 与 GitHub Pages 建站、Docker、LLaMA/大模型、本地部署、LLM 学习总结
- 特色页面：`source/zoo/index.md` 提供一个自定义的互动动物园页面
- 部署目标：GitHub Pages 仓库 `git@github.com:Yi-22514/Yi-22514.github.io.git`，分支 `master`

## 技术栈

- `Hexo 7.3.0`：静态博客生成器
- `hexo-theme-async 2.2.2`：当前启用主题
- `hexo-deployer-git`：通过 Git 部署到 GitHub Pages
- `hexo-renderer-marked`：Markdown 渲染
- `hexo-renderer-ejs`、`hexo-renderer-less`、`hexo-renderer-stylus`：主题与样式渲染支持
- `hexo-generator-index`、`hexo-generator-archive`、`hexo-generator-category`、`hexo-generator-tag`：首页、归档、分类、标签生成

依赖声明集中在 `package.json`，锁定信息在 `package-lock.json`。

## 目录速览

```text
.
├── _config.yml              # Hexo 主配置：站点、目录、分页、主题、部署等
├── _config.async.yml        # Async 主题配置：导航、侧边栏、封面、banner、用户信息等
├── package.json             # npm 脚本和 Hexo 依赖
├── scaffolds/               # hexo new 使用的文章/页面模板
├── scripts/                 # Hexo 扩展脚本，会在生成时自动加载
│   ├── pet-injector.js      # 页面顶部随机移动小动物效果
│   └── visual-effects.js    # 动态天空、滚动显现、自定义鼠标光标等效果
├── source/                  # 站点源码内容
│   ├── _posts/              # 博客文章
│   ├── categories/          # 分类页入口
│   ├── css/custom.css       # 全站自定义样式
│   ├── img/                 # 文章配图、封面图、侧边栏资源
│   ├── sw.js                # Service Worker
│   └── zoo/index.md         # 自定义互动动物园页面
├── public/                  # Hexo 生成后的静态站点产物
└── .deploy_git/             # hexo deploy 使用的部署缓存目录
```

`public/`、`.deploy_git/`、`db.json`、日志文件和 `node_modules/` 都属于生成物或本地依赖，不是主要源码。

## 核心配置

### `_config.yml`

Hexo 主配置文件，当前重点配置包括：

- `author: Yi`
- `language: zh-Hans`
- `source_dir: source`
- `public_dir: public`
- `theme: async`
- `permalink: :year/:month/:day/:title/`
- `per_page: 10`
- `deploy.type: git`
- `deploy.repo: git@github.com:Yi-22514/Yi-22514.github.io.git`
- `deploy.branch: master`

注意：当前 `url` 还是 `http://example.com`，正式部署时建议改成实际站点地址，例如 GitHub Pages 地址或自定义域名。

### `_config.async.yml`

Async 主题配置文件，主要负责：

- 明暗主题自动切换：`theme.default: auto`
- favicon 与标签页失焦/聚焦文案
- 加载全站自定义 CSS：`cdn.css: /css/custom.css`
- 侧边栏打字文本、社交链接、个人信息
- 顶部导航：`首页`、`归档`、`分类`、`🦁 动物园`
- 首页视频 banner 和标题文案
- 文章默认随机封面图列表

## 内容结构

当前文章主要放在 `source/_posts/` 下，已有内容包括：

- `Hexo + github搭建个人博客网站.md`：Hexo + GitHub Pages 建站记录
- `windows安装docker.md`：Windows 安装 Docker
- `Llama本地简单部署.md`：Llama3 本地简易部署
- `Transformer架构个人学习总结.md`：Transformer 架构学习总结
- `预训练语言模型个人学习总结.md`
- `大语言模型个人学习总结.md`
- `动手搭建大模型个人学习总结.md`
- `大模型训练实践个人学习总结.md`
- `大模型应用个人学习总结.md`

近期的大模型系列文章使用了 `LLM` 分类，并设置了 `tags`、`katex: true`、`single_column: true` 和本地封面图。

常见文章 front matter 示例：

```yaml
---
title: 文章标题
date: 2026-06-16 00:00:00
categories: LLM
tags:
  - Transformer
  - LLM
katex: true
single_column: true
banner:
  type: img
  bgurl: /img/covers/starry_night.png
---
```

## 自定义功能

### 全站视觉样式

`source/css/custom.css` 对 Async 主题做了全局覆盖和增强，主要包括：

- Logo 渐变文字
- 侧边栏个人卡片玻璃拟态效果
- 侧边栏社交区域背景图，使用 `/img/sidebar/bright.jpg` 和 `/img/sidebar/dark.gif`
- 动态天空 canvas 背景样式
- 文章卡片 hover 动效
- 滚动进入视图时的 reveal 动画
- 自定义鼠标光标和磁吸交互

这些样式大量依赖 Async 主题的 `trm-*` 类名。升级主题时，需要重点检查这些选择器是否仍然生效。

### Hexo 注入脚本

`scripts/pet-injector.js` 使用 `hexo.extend.injector.register('body_end', ...)` 向页面尾部注入小动物动画。生成站点时，脚本会自动加载，不需要手动引用。

`scripts/visual-effects.js` 同样注入到 `body_end`，负责：

- 动态天空粒子背景
- 页面滚动显现动画
- 自定义鼠标光标、点击脉冲、磁吸按钮效果

脚本中已考虑 `prefers-reduced-motion`，对减少动态效果偏好的用户会自动降低或关闭部分动画。

### 互动动物园页面

`source/zoo/index.md` 是一个自定义页面，包含内联 CSS 和 JavaScript。它实现了：

- 动物选择与添加
- 食物投喂
- 雨雪天气效果
- 动物移动、追逐、互动状态
- 数量统计与清场操作

导航入口配置在 `_config.async.yml` 的 `top_bars` 中。

## 常用命令

首次安装依赖：

```bash
npm install
```

本地预览：

```bash
npm run server
```

生成静态站点：

```bash
npm run build
```

清理生成物：

```bash
npm run clean
```

部署到 GitHub Pages：

```bash
npm run deploy
```

如果当前终端没有把 `npm` 加入 PATH，但已经有可用的 Node.js，也可以直接调用本地 Hexo 入口：

```bash
node ./node_modules/hexo/bin/hexo generate
node ./node_modules/hexo/bin/hexo server
node ./node_modules/hexo/bin/hexo deploy
```

## 写作流程

新建文章：

```bash
npx hexo new "文章标题"
```

也可以直接在 `source/_posts/` 下创建 Markdown 文件。建议保持以下习惯：

- 文件名使用清晰的中文或英文标题
- front matter 中补充 `title`、`date`、`categories`、`tags`
- 大模型/数学内容需要公式时设置 `katex: true`
- 优先使用 `source/img/covers/` 下的本地封面，减少外链图片失效风险
- 文章相关图片可以放在 `source/img/<文章主题>/` 下，再用 `/img/<文章主题>/xxx.jpg` 引用

## 部署流程

推荐流程：

```bash
npm run clean
npm run build
npm run deploy
```

`hexo deploy` 会根据 `_config.yml` 的 `deploy` 配置，把生成结果推送到 `Yi-22514.github.io` 仓库的 `master` 分支。

部署前建议检查：

- `_config.yml` 中的 `url` 是否是实际站点地址
- SSH key 是否有目标 GitHub 仓库权限
- 外链 banner 或文章图片是否还能访问
- `public/` 中生成结果是否符合预期

## 维护注意点

- `themes/` 目录目前基本为空，因为主题通过 npm 包 `hexo-theme-async` 提供。
- `source/css/custom.css` 和 `scripts/*.js` 是当前站点个性化程度最高的地方，改主题或升级主题后优先检查这里。
- `source/zoo/index.md` 是完整的自定义页面，样式和逻辑都写在同一个 Markdown 文件里，修改时注意不要破坏 front matter。
- `.deploy_git/` 是 Hexo 部署缓存目录，不等同于源码仓库。
- 当前工作区没有可见的 `.git/` 元数据；如果需要源码版本管理，请确认是否在正确的 Git 仓库目录中。
- `.gitignore` 已忽略 `node_modules/`、`public/`、`.deploy*/`、`db.json` 和日志文件。

## 当前构建状态

已使用本地 Hexo 入口验证过静态生成流程：

```bash
node ./node_modules/hexo/bin/hexo generate
```

生成成功，可以正常产出 `public/` 静态站点文件。
