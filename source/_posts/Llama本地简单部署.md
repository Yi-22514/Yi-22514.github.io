---
title: Llama3本地简易部署
categories: Llama
single_column: true
banner:
  type: img
  bgurl: https://haowallpaper.com/link/common/file/getCroppingImg/15098960865889600
---

截至目前为止，史上最强开源AI大模型——Meta的LLaMa3一经发布，各项指标全面逼近GPT-4。它提供了8B和70B两个版本，8B版本最低仅需4G显存即可运行，可以说是迄今为止能在本地运行的最强LLM。

虽然LLaMa3对中文支持不算好，但HuggingFace上很快出现了各种针对中文的微调模型，本文将介绍如何在本地简单运行发布在HuggingFace上的各种LLaMa3大模型。



需要准备：

- 安装Ollama
- 下载内置模型
- 导入模型
- 运行模型
- 搭建web环境

**本文需要从国外下载资源，需要科学上网，需要自行准备工具！**



# 一、安装Ollama

​	首先安装Ollama，它可以让我们非常方便地运行各种LLM。从[Ollama官网](https://ollama.com/)下载，运行，点击安装Ollama命令行，然后在命令行测试Ollama是否已正常运行：

![图](/img/Llama/10.jpg)

```
ollama -v
```

如果能看到版本信息，即安装成功。



# 二、下载模型

​	Ollama可以直接下载内置的几种模型，但选择有限。我们可以从[HuggingFace](https://huggingface.co/)下载以评估各种模型，从HuggingFace下载，会更方便一点。

在上方工具栏找到设置，设置`Languages`为`Chinese`，可以看到若干基于LLaMa3的中文模型：

![图](/img/Llama/1.jpg)



HuggingFace搜索`llama3`，选择一个GGUF格式的模型，GGUF格式是llama.cpp团队搞的一种模型存储格式，一个模型就是一个文件，方便下载：



![图](/img/Llama/2.jpg)



然后选择**Files and versions**（红框中的内容），列出多项模型，可以看到若干GGUF文件，其中，q越大说明模型质量越高，同时文件也更大，我们选择q6，直接点击下载按钮，把这个模型文件下载到本地。



![图](/img/Llama/3.jpg)

等待下载完毕即可。



# 三、导入模型



​	下载到本地的模型文件不能直接导入到Ollama，需要编写一个配置文件，随便起个名字，如`config.txt`，配置文件内容如下：

```
FROM "D:/llama3/llama3-8b-cn-q6/Llama3-8B-Chinese-Chat.q6_k.GGUF"

TEMPLATE """{{- if .System }}
<|im_start|>system {{ .System }}<|im_end|>
{{- end }}
<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""

SYSTEM """"""

PARAMETER stop <|im_start|>
PARAMETER stop <|im_end|>
```

第一行`FROM "..."`指定了模型文件路径，需要修改为实际路径，后面的模板内容是网上复制的，无需改动。

然后，使用以下命令导入模型：

```
ollama create llama3-cn -f ./config.txt
```

`llama3-cn`是给模型起的名字，成功导入后可以用`ollama list`命令查看：

![图](/img/Llama/4.jpg)

可以下载多个模型，给每个模型写一个配置文件（仅需修改路径），导入时起不同的名字，我们就可以用Ollama方便地运行各种模型。



# 四、运行模型

使用Ollama的`run`命令可以直接运行模型。我们输入命令：

```
ollama run llama3-cn
```

出现以下界面即为导入成功：

![图](/img/Llama/5.jpg)

这之后我们可以随便输入一些问题，可以看到结果：

![图](/img/Llama/6.jpg)

出现`>>>`提示符时就可以输入问题与模型交互。输入`/exit`退出。



# 五、搭建Web环境

​	使用命令行交互不是很方便，所以我们需要另一个开源的[Open WebUI](https://github.com/open-webui/open-webui)，搭建一个能通过浏览器访问的界面。

运行Open WebUI最简单的方式是直接以Docker运行。我们安装[Docker Desktop](https://www.docker.com/products/docker-desktop/)，在命令行输入以下命令启动Open WebUI（需要注意的是，输入以下命令可能会下载很慢，需要提前运行科学上网工具，方便从外网拉取资源）：

```
docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

![图](/img/Llama/7.jpg)

等待运行结束即可。

![图](/img/Llama/9.jpg)



参数`-p 3000:8080`将Open WebUI的端口映射到本机。参数`-e OLLAMA_BASE_URL=http://host.docker.internal:11434`告诉Open WebUI通过本机的11434访问Ollama。

注意地址必须写`host.docker.internal`，不能写`127.0.0.1`。

打开浏览器我们就可以访问[http://127.0.0.1:3000](http://127.0.0.1:8080/)，第一次访问需要注册，注册和登录是完全基于本地环境的，登录后就可以看到类似GPT的UI。

之后我们就能看到UI界面了：

![图](/img/Llama/12.jpg)

![图](/img/Llama/13.jpg)

同时，在Docker Desktop里面，也能看到我们刚建立的容器：![图](/img/Llama/11.jpg)

在Docker Desktop里面，可以随时启动、关闭、删除这个服务。