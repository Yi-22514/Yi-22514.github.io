---
title: Transformer架构个人学习总结
date: 2026-06-16 00:00:05
categories: LLM
tags:
  - Transformer
  - Attention
  - LLM
katex: true
single_column: true
banner:
  type: img
  bgurl: /img/covers/starry_night.png
---

# Transformer架构个人学习总结

最近学习了 Datawhale 的 Happy-LLM 第二章《Transformer 架构》，这篇文章算是我对 Transformer 的一次阶段性整理。以前看到 Transformer，总觉得它和“大模型”几乎是绑定出现的词，但真正顺着 Attention、Encoder-Decoder、位置编码这些组件往下看，才发现它并不是一个神秘黑盒，而是一套围绕“如何让序列中的 token 更高效地互相建模”展开的结构设计。

如果只用一句话概括我现在的理解：**Transformer 把序列建模的核心，从 RNN 那种“按顺序一步步读”，变成了“让所有 token 同时互相观察，再用位置编码补上顺序信息”。**

## 一、为什么需要 Transformer

在 Transformer 出现之前，NLP 中常见的序列建模方法是 RNN、LSTM 这类循环神经网络。它们的思路很自然：一句话从左到右读，每一步都带着前面的状态继续往后处理。这种方式很符合人读句子的直觉，但放到大规模训练里会遇到两个明显问题。

第一个问题是**难并行**。RNN 的第 t 个位置依赖第 t-1 个位置的计算结果，所以它很难像 CNN 或矩阵乘法那样一次性铺开计算。数据量和模型规模上来以后，这会直接拖慢训练效率。

第二个问题是**长距离依赖难捕捉**。如果一句话很长，前面某个词和后面某个词存在关系，RNN 需要通过很多步状态传递才能把信息带过去。LSTM 用门机制缓解了这个问题，但并没有从根上改变“顺序传递”的限制。

Transformer 的想法非常直接：既然序列里的每个词都可能和其他词相关，那就干脆让它们两两计算关系。这个关系计算的核心，就是注意力机制。

## 二、Attention 的核心：Q、K、V

注意力机制里有三个重要变量：

- Query：当前我想查什么
- Key：每个 token 可以被匹配的特征
- Value：每个 token 真正提供的信息

我比较喜欢把它理解成一次“带权重的信息检索”：Query 先和所有 Key 做相似度计算，得到每个位置的重要程度；再用这些重要程度去加权 Value，得到当前位置真正吸收的信息。

标准的缩放点积注意力公式是：

$$\mathrm{Attention}(Q,K,V)=\mathrm{softmax}(\frac{QK^T}{\sqrt{d_k}})V$$

这个公式可以拆成三步理解：

1. 用 $QK^T$ 计算 Query 和 Key 的相似度。
2. 除以 $\sqrt{d_k}$，避免维度太大时点积值过大，导致 softmax 后分布过尖、训练不稳定。
3. 用 softmax 得到注意力权重，再乘以 $V$，得到加权后的信息表示。

从这个角度看，Attention 的本质不是“记住所有内容”，而是**根据当前问题动态选择重要信息**。这也是它比固定窗口或单一路径传播更灵活的地方。

## 三、自注意力：一句话内部的互相理解

Self-Attention 是 Transformer 最关键的部分。它的特点是 Q、K、V 都来自同一个输入序列，只是经过不同的参数矩阵映射。

也就是说，句子里的每个 token 都会问一遍：“我应该关注句子里的哪些位置？”比如在“我喜欢机器学习，因为它很有趣”这句话中，“它”需要和前面的“机器学习”建立联系。Self-Attention 就是在学习这种 token 之间的相关关系。

这让我意识到，Transformer 处理文本时并不是简单地从左到右读，而是更像在建立一张关系图：每个 token 是图里的点，注意力权重是点与点之间边的强弱。

## 四、Mask Self-Attention：不能偷看答案

在语言模型中，模型通常要根据前面的 token 预测下一个 token。比如：

```text
输入：我 喜欢
预测：机器
```

如果训练时让模型看到未来 token，那它就相当于提前看到了答案，学习任务就失去了意义。因此 Decoder 中会使用 Mask Self-Attention，把当前位置之后的信息遮住。

具体做法可以理解为给注意力分数加一个上三角 mask。未来位置被加上 $-\infty$，经过 softmax 后权重会变成 0。这样模型在训练时虽然可以并行处理整句话，但每个位置仍然只能看到它前面的历史信息。

这点是我觉得 Transformer 很巧妙的地方：**它保留了语言模型“只能看过去”的约束，同时又尽量利用矩阵计算实现并行训练。**

## 五、多头注意力：从多个角度看同一句话

单个注意力头只能学习一种关系，但语言里的关系往往不止一种。有些头可能更关注语法结构，有些头可能更关注指代关系，有些头可能更关注局部搭配。

Multi-Head Attention 的做法是：把输入映射成多组 Q、K、V，每组独立做注意力计算，然后把结果拼接起来，再经过一个线性层融合。

公式可以写成：

$$\mathrm{MultiHead}(Q,K,V)=\mathrm{Concat}(head_1,\dots,head_h)W^O$$

其中：

$$head_i=\mathrm{Attention}(QW_i^Q,KW_i^K,VW_i^V)$$

我的理解是，多头注意力让模型拥有了“多视角阅读能力”。同一句话不再只有一种理解路径，而是可以同时从不同子空间提取关系。

## 六、Encoder 和 Decoder 的分工

原始 Transformer 是 Encoder-Decoder 架构，最早主要用于机器翻译这类 Seq2Seq 任务。输入是一段序列，输出是另一段序列。

Encoder 的作用是**理解输入**。每个 Encoder Layer 通常包含：

1. 多头自注意力
2. 前馈神经网络
3. LayerNorm
4. 残差连接

Decoder 的作用是**生成输出**。它比 Encoder 多一个注意力模块，整体包括：

1. Masked Multi-Head Self-Attention：看已经生成的目标序列，不能看未来。
2. Cross-Attention：用 Decoder 当前状态作为 Query，用 Encoder 输出作为 Key 和 Value，从输入序列中取信息。
3. 前馈神经网络。
4. LayerNorm 和残差连接。

这样一看，Encoder 和 Decoder 的关系就比较清楚了：Encoder 把源序列压成带上下文的信息表示，Decoder 一边看自己已经生成的内容，一边从 Encoder 输出中提取需要的信息，然后逐步生成目标序列。

后来的很多模型，其实都是在这个基础上做取舍。比如 BERT 主要使用 Encoder，适合理解类任务；GPT 主要使用 Decoder，适合生成类任务。

## 七、前馈神经网络、LayerNorm 和残差连接

Transformer 里除了 Attention，还有三个很重要但容易被忽略的组件。

**前馈神经网络**负责对每个位置的表示做非线性变换。Attention 更像是在不同 token 之间交换信息，而 FFN 更像是在每个 token 内部进一步加工特征。

**LayerNorm**用于稳定训练。它会在每个样本内部做归一化，让不同层之间的数据分布更平稳。相比 BatchNorm，LayerNorm 更适合变长序列和 NLP 场景。

**残差连接**则负责保留原始信息并改善梯度传播。它的形式很简单：

$$x = x + Sublayer(LayerNorm(x))$$

但作用很关键：模型不用每一层都重新学习完整表示，而是学习“在原来的基础上该补充什么”。这对深层网络非常重要。

我以前容易把这些组件当成结构图里的“小零件”，但现在感觉它们其实共同解决了一个问题：**让 Attention 这个强大的模块可以稳定地堆很多层。**

## 八、位置编码：给并行计算补上顺序感

Attention 本身并不知道顺序。对于它来说，如果没有额外信息，“我喜欢你”和“你喜欢我”包含的是同一组 token，它很难区分词序带来的语义差异。

所以 Transformer 需要位置编码。原始 Transformer 使用正余弦位置编码：

$$PE(pos,2i)=\sin(pos/10000^{2i/d_{model}})$$

$$PE(pos,2i+1)=\cos(pos/10000^{2i/d_{model}})$$

位置编码会加到词向量上，让每个 token 的表示同时包含“它是什么”和“它在哪里”。正余弦函数的好处是可以推广到训练时没见过的更长序列，并且相对位置关系可以通过三角函数性质表达出来。

这部分给我的启发是：Transformer 不是天然懂顺序，而是通过额外设计把顺序信息注入进去。也正因为如此，后来才会出现各种位置编码改进，比如可学习位置编码、RoPE 等。

## 九、完整 Transformer 的流程

把所有组件串起来，一个完整 Transformer 大致可以理解为：

1. 文本经过 tokenizer 转成 token id。
2. token id 进入 Embedding 层，变成向量。
3. 加上位置编码，注入顺序信息。
4. 输入 Encoder 或 Decoder 的多层堆叠结构。
5. 每层通过 Attention 交换 token 间信息，通过 FFN 加工特征，通过 LayerNorm 和残差连接稳定训练。
6. 最后经过线性层和 softmax，输出每个 token 的概率分布。

如果是机器翻译这样的 Encoder-Decoder 模型，就会先用 Encoder 编码源语言，再用 Decoder 逐步生成目标语言。如果是 GPT 这样的 Decoder-only 模型，则主要依靠 Mask Self-Attention 做自回归生成。

## 十、我的阶段性理解

学完这一章后，我对 Transformer 最大的感受是：它并不是单靠某一个公式取胜，而是一整套结构协同的结果。

Attention 解决了序列内部动态关联的问题；Multi-Head 让模型可以从多个角度看关系；Mask 保证生成任务不偷看未来；位置编码补上了顺序信息；LayerNorm 和残差连接让深层堆叠变得可训练；FFN 则继续增强每个位置的特征表达。

所以，Transformer 的强大不是“注意力机制很强”这么简单，而是它把**并行计算、长距离依赖建模、稳定深层训练、序列生成约束**这些问题放在同一个框架里一起解决了。

当然，我现在的理解还只是第一层。后面还需要继续看：

- GPT 为什么选择 Decoder-only 架构
- BERT 的 Encoder-only 和 GPT 的 Decoder-only 在训练目标上有什么区别
- RoPE、KV Cache、Grouped Query Attention 这些现代 LLM 结构是怎么从原始 Transformer 演化来的
- 如何用 PyTorch 从零实现一个小型 Transformer

这篇总结先作为一个起点。之后再回头看大模型训练、推理优化和 LLaMA 结构时，Transformer 这块应该会越来越清楚。

## 参考资料

- [Datawhale Happy-LLM：第二章 Transformer 架构](https://datawhalechina.github.io/happy-llm/#/./chapter2/%E7%AC%AC%E4%BA%8C%E7%AB%A0%20Transformer%E6%9E%B6%E6%9E%84)
- [Vaswani et al. Attention Is All You Need](https://arxiv.org/abs/1706.03762)
