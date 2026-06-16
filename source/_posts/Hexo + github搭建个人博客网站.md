---
title: Hexo + Github 搭建个人博客
categories: 搭建博客
single_column: true
banner:
  type: img
  bgurl: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTy_axSqyyq11x5JqZ_rKbzYcbXLORVp-1nAw&s
---

# Hexo + Github 搭建个人博客

今年七月份的时候，在github搭建了一个人博客，初衷就是想拿来作为自己的在线笔记本，做做学习记录，分享一些学到的东西，使用第三方提供的博客服务其实也挺方便，当今网络上提供服务的博客网站也很多。自己曾经也尝试过用云服务器搭建网站，但是自己购买域名和服务器，搭建博客的成本有点高了，还要定期的维护它，自己也是没有这样的精力和时间。然后在网上无意间看到了可以用github pages 托管网站，也是查阅了一些资料，最后搭建好了，达到差不多的效果。（guithub在国外，托管的网站访问时，会很慢，但是总归算是有一个博客了。:blush:）稍微分享一下自己的搭建过程。



这里我是参考了CSDN上的一个博主的文章搭建的，可以去CSDN上看一下博主的原文：[原文](https://blog.csdn.net/qq_58608526/article/details/124652412?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522172145607016800222864956%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=172145607016800222864956&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~top_positive~default-1-124652412-null-null.142^v100^pc_search_result_base3&utm_term=hexo%20github%E6%90%AD%E5%BB%BA%E4%B8%AA%E4%BA%BA%E5%8D%9A%E5%AE%A2&spm=1018.2226.3001.4187)



搭建步骤：

- 1.安装Git、nodejs、hexo
- 2.`GitHub`创建个人仓库
- 3.生成`SSH`添加到`GitHub`
- 4.将`hexo`部署到`GitHub`
- 5.设置个人域名
- 6.发布文章



## 一、安装Git、nodejs、hexo

##### 	（1）安装Git

​	为了把本地的网页文件上传到github上面去，需要用到工具———[Git](https://git-scm.com/download)

Git是目前世界上最先进的分布式版本控制系统，可以有效、高速的处理从很小到非常大的项目版本管理。`Git`非常强大，建议大家去了解一下。

跳转到git官网后选择自己对应的系统去下载.exe文件、然后安装即可。安装完成后在命令提示符中输入`git --version`来查看一下版本验证是否安装成功。

##### 	（2）安装nodejs

​	Hexo是基于node.js编写的，所以需要安装一下node.js。

windows版本下载稳定版或者最新版都可以Node.js，安装选项全部默认，一路点击Next。
最后安装好之后，按Win+R打开命令提示符，输入node -v和npm -v，如果出现版本号，那么就安装成功了。


![图](/img/hexoGithubBlog/1.jpg)

安装完后，打开命令行终端，输入:

```
node -v
npm -v
```

检查一下有没有安装成功



**提示**

国内访问外网会比较慢，没有梯子的话，可以使用阿里的国内镜像进行加速。

```
npm config set registry https://registry.npm.taobao.org
```



##### （3）安装Hexo

​	git和nodejs安装好后，就可以安装hexo了，可以先创建一个文件夹blog，用来存放自己的博客文件，然后在这个文件夹里，鼠标右键，找到git bash，打开。

![图](/img/hexoGithubBlog/2.jpg)


安装可以参考Hexo官网提供的安装步骤：[Hexo官网](https://hexo.io/zh-cn/)

定位到自己的博客目录下，

输入以下代码进行安装：

```
npm install hexo-cli -g
```

安装完后输入hexo -v验证是否安装成功。

至此hexo就安装完了。



初始化自己的博客文件夹：

```
hexo init 
```

初始化过程中可能会出现权限问题，可以右键这个文件夹，在上方属性栏选择安全，编辑用户权限。

![图](/img/hexoGithubBlog/5.jpg)

在用户权限这一栏勾选全部就行。然后再次尝试hexo init 初始化。



初始化之后，接着输入

```
npm install
```

 安装必备的组件。


新建完成后，指定文件夹Hexo目录下有：

node_modules: 依赖包
public：存放生成的页面
scaffolds：生成文章的一些模板
source：用来存放你的文章
themes：主题**
_config.yml: 博客的配置文件**

这样本地的网站配置也弄好啦，输入hexo g生成静网页，然后输入hexo s打开本地服务器，

```
hexo g
hexo server (或者简写:hexo s）
```



启动服务后在浏览器可查看到下图即为初步搭建成功：

![图](/img/hexoGithubBlog/4.jpg)

如果想要让自己的博客看起来高级一点，可以找一个模板来用。

![图](/img/hexoGithubBlog/3.jpg)

博客模板，可以自己创造一个。也可以直接用官网提供的模板主题：[模板主题](https://hexo.io/themes/https://hexo.io/themes/)

在模板的github网站上，依照下面的readme，一步步安装主题就行。

![图](/img/hexoGithubBlog/6.jpg)




## 二、去Github上创建一个账号、创建个人仓库

​	接下来就去注册一个`github`账号，用来存放我们的网站。

打开[https://github.com/](github)，新建一个项目仓库`New repository`，如下所示：

![图](/img/hexoGithubBlog/13.jpg)

这里需要注意的是，仓库的名称需要是:：自己Github的名字 .github.io

以我自己的仓库为例子，我的Github名称是：Yi-22514，所以我的仓库名需要是：Yi-22514.github.io



# 三、生成SSH

生成SSH添加到GitHub
生成SSH添加到GitHub，连接Github与本地。
右键打开git bash，然后输入下面命令：

```
git config --global user.name "yourname"
git config --global user.email "youremail"
```


注意：第一次使用git后需要将用户名和邮箱进行初始化

这里的yourname输入你的GitHub用户名，youremail输入你GitHub的邮箱。这样GitHub才能知道你是不是对应它的账户。例如我的：

```
git config --global user.name "Yi-222514"
git config --global user.email "xxx@xxx.com"
```

可以用以下两条，检查一下你有没有输对

```
git config user.name
git config user.email
```

然后创建SSH,一路回车

ssh，简单来讲，就是一个秘钥，其中，id_rsa是你这台电脑的私人秘钥，不能给别人看的，id_rsa.pub是公共秘钥，可以随便给别人看。把这个公钥放在GitHub上，这样当你链接GitHub自己的账户时，它就会根据公钥匹配你的私钥，当能够相互匹配时，才能够顺利的通过git上传你的文件到GitHub上。

```
ssh-keygen -t rsa -C "youremail"
```

这个时候它会告诉你已经生成了.ssh的文件夹。在你的电脑中找到这个文件夹。或者git bash中输入

```
cat ~/.ssh/id_rsa.pub
```

将输出的内容复制到框中，点击确定保存。

打开github，在头像下面点击settings，再点击SSH and GPG keys，新建一个SSH，名字随便取一个都可以，把你的id_rsa.pub里面的信息复制进去。如图：



在git bash输入

```
ssh -T git@github.com
```

如果如下图所示，出现你的用户名，那就成功了。

![图](/img/hexoGithubBlog/7.jpg)



# 四、将hexo部署到Github上



这一步，我们就可以将hexo和GitHub关联起来，也就是将hexo生成的文章部署到GitHub上，打开博客根目录下的_config.yml文件，这是博客的配置文件，在这里你可以修改与博客配置相关的各种信息。

修改最后一行的配置：

```
deploy:
  type: git
  repository: https://github.com/你的github名字/你的github名字.github.io.git
  branch: master
```


repository修改为你自己的github项目地址即可就是部署时，告诉工具，将生成网页通过git方式上传到你对应的链接仓库中。

这个时候需要先安装deploy-git ，也就是部署的命令,这样你才能用命令部署到GitHub。

```
npm install hexo-deployer-git --save
```

然后

```
hexo clean
hexo generate
hexo deploy
```

 hexo clean 清除了你之前生成的东西，也可以不加。 

hexo generate 生成静态文章，可以用 hexo g 缩写 。

hexo deploy部署文章，可以用hexo d 缩写。

**deploy时可能要你输入username和password。**

浏览器出现下图就说明部署成功了，然后就可以在http://yourname.github.io 这个网站看到博客了！！
![图](/img/hexoGithubBlog/8.jpg)





# 五、Github绑定个人域名

​	绑定个人域名，首先我们需要有一个域名，可以选择去各大云服务器厂商购买域名。我是在腾讯云上购买的域名，也不用太贵，找几个五六块钱一年的域名购买就行。

​	购买域名后，找到控制台，点进去查看自己的域名

![图](/img/hexoGithubBlog/9.jpg)

然后解析，添加记录，按钮下图设置后确定即可：
![图](/img/hexoGithubBlog/10.jpg)

然后打开你的`github`博客项目，点击`settings`，左侧栏目找到pages，拉到下面`Custom domain`处，填上你自己购买的域名，保存：

![图](/img/hexoGithubBlog/11.jpg)

Save后，会显示Check in Progress，github上绑定的域名需要一段时间在全球范围内传递更新，需要耐心等待，可能需要等半天到一天。

过段时间后，就可以通过购买的域名访问自己的github博客啦！！



# 六、发布文章

首先在博客根目录下右键打开git bash，安装一个扩展

```
npm i hexo-deployer-git
```

然后输入hexo new post "我的第一篇博客"，新建一篇文章。

然后打开你的博客文件夹，在source目录下有一个_post文件夹，里面有.md文件，是你的博客文章。你可以会直接在Typora里面编写markdown文件.

编写完markdown文件后，根目录下输入hexo g生成静态网页，然后输入hexo s可以本地预览效果，最后输入hexo d上传到github上。这时打开你的github.io主页就能看到发布的文章啦。

```
hexo generate 
hexo deploy 
```

也可以简写为：

```
hexo g
hexo d
```

需要特别注意的是：hexo d 部署博客后，github上的域名绑定会消失，需要重新在github pages里绑定个人域名！

------

发布文章、修改主题的时候，可以在博客文件夹里右键启动git bash或命令行，使用

```
npm run server
```

来查看自己的完成情况。

![图](/img/hexoGithubBlog/12.jpg)

------

到此，已经完整搭建起一个比较简陋的个人博客了。