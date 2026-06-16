---
title: 安装Docker
categories: Docker
single_column: true
banner:
  type: img
  bgurl: https://paooo.com/media/2023/09/1695020208-1695020208-image-jpg-webp.webp
---

​	Docker 是一种开源的容器化平台，旨在简化应用程序的开发、部署和运行过程。它提供了一种轻量级、可移植和自包含的容器化环境，使开发人员能够在不同的计算机上以一致的方式构建、打包和分发应用程序。



# 一、Docker介绍

以下是 Docker 的几个核心概念：

**（1）容器（Container）：**容器是 Docker 的基本部署单元。它是一个轻量级的、独立的运行时环境，包含应用程序及其相关依赖。容器利用 Linux 内核的命名空间和控制组技术，实现了隔离性和资源管理，使得应用程序在不同的容器中运行不会相互影响。
**（2）镜像（Image）：**镜像是用于创建容器的模板。它包含了一个完整的文件系统，其中包括应用程序运行所需的所有文件、依赖和配置信息。镜像是不可变的，通过 Docker 镜像可以创建多个相同的容器实例。
镜像仓库（Image Registry）：镜像仓库是用于存储和分发 Docker 镜像的地方。最常用的公共镜像仓库是 **（3）**

**（3）Docker Hub：**上面有大量的官方和社区共享的镜像。此外，还可以搭建私有的镜像仓库，用于存放自己的镜像。
**（4）Dockerfile：**Dockerfile 是一种文本文件，用于定义 Docker 镜像的构建过程。它包含了一系列的指令，用于指定基础镜像、安装软件、拷贝文件、配置环境等。通过 Dockerfile，可以自动化地构建镜像，确保镜像的一致性和可重复性。
	Docker 的优势在于它的轻量性、可移植性和灵活性。通过使用 Docker，开发人员可以更轻松地创建一个可靠的开发环境、快速部署应用程序、实现弹性扩展和服务编排等。同时，它也提供了生态系统丰富的工具和服务，例如容器编排工具 Docker Compose 和容器编排平台 Kubernetes，使得容器化应用的管理更加便捷和高效。



# 二、任务栏搜索：启用或关闭Windows功能

​	需要勾选图中倒数2、3个

![图](/img/installDocker/1.jpg)





# 三、下载WSL

设置默认版本是2

```
wsl --set-default-version 2
```

![图](/img/installDocker/2.jpg)

安装wsl：

```
wsl --update --web-download
```

国内网络建议在最后加上：--web-download，避免网络问题。如果能够科学上网，就可不加了。



# 四、安装Docker

可以去官网上下载：[Docker官网](https://www.docker.com/get-started/)

![图](/img/installDocker/6.jpg)



下载后会有一个.exe安装文件。Docker默认是安装在C盘的，如果需要指定安装位置，就在命令行输入：

```
start /w "" "Docker Desktop Installer.exe" install --installation-dir=D:\Docker
```

把最后的安装路径换成自己想安装的位置即可。



# 五、配置镜像源加速

打开Docker Desktop，点击上方工具栏的设置，选择左侧的 Doocker Engine选项，将内容替换。

![图](/img/installDocker/4.jpg)

全部替换为：

```
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}
```

然后右下角完成部署即可！