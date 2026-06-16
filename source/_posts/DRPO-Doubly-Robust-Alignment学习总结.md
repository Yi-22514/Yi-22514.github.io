---
title: DRPO：Doubly Robust Alignment for Large Language Models 学习总结
date: 2026-06-16 09:30:00
categories: LLM
tags:
  - RLHF
  - DPO
  - DRPO
  - Preference Optimization
  - Alignment
katex: true
single_column: true
banner:
  type: img
  bgurl: /img/covers/starry_night.png
---

# DRPO：Doubly Robust Alignment for Large Language Models 学习总结

最近读了论文《Doubly Robust Alignment for Large Language Models》。这篇文章讨论的是大语言模型对齐中的一个很现实的问题：我们在 RLHF 或偏好优化中依赖的模型，往往并没有想象中那么可靠。奖励模型可能错，偏好模型可能错，参考策略也可能不是我们以为的那个分布。一旦这些基础组件被错设，后续微调出来的模型就可能偏离真实的人类偏好。

这篇论文提出的 DRPO，也就是 Doubly Robust Preference Optimization，试图把统计学和因果推断中非常经典的 doubly robust 思想引入大模型偏好对齐。它的核心目标不是设计一个更花哨的 loss，而是回答一个更基础的问题：在偏好模型和参考策略都可能不准的情况下，能不能构造一个更稳健的偏好估计器，并基于这个估计器做策略优化？

我的理解是，这篇文章的价值主要有三点：

1. 它把 RLHF 中的模型错设问题讲得很清楚。
2. 它把 direct method 和 importance sampling 组合成一个 doubly robust 的偏好评估器。
3. 它进一步把这个评估器变成了可训练的偏好优化算法 DRPO。

下面按照背景、问题、研究现状、方法和算法细节来梳理。

## 1. 背景：为什么大模型需要偏好对齐

大语言模型的预训练目标通常是 next-token prediction，也就是给定前文预测下一个 token。这个目标非常适合从海量文本中学习语言模式、知识和推理能力，但它和真实部署时的目标并不完全一致。

真实场景中，我们希望模型回答得：

- 有帮助，能解决用户问题；
- 诚实，不编造事实；
- 安全，不输出危险内容；
- 符合人类偏好，比如表达清楚、语气合适、拒答边界合理。

这就产生了一个目标错位：预训练学到的是“像语料一样续写”，而部署需要的是“按人类偏好回答”。因此，大模型通常还需要后训练阶段，例如 SFT、RLHF、DPO 等。

经典 RLHF 流程大致分三步：

1. 先用高质量指令数据做监督微调，得到参考策略或初始策略。
2. 收集人类偏好数据，例如给同一个 prompt 生成两个回答，让人标注哪个更好。
3. 训练奖励模型，再用 PPO 等强化学习算法优化语言模型。

如果把 prompt 记为 $X$，两个回答记为 $Y^{(1)}$ 和 $Y^{(2)}$，偏好标签记为：

$$
Z = I(Y^{(1)} \succ Y^{(2)})
$$

那么 RLHF 的训练数据可以写成：

$$
D = \{(X_i, Y_i^{(1)}, Y_i^{(2)}, Z_i)\}_{i=1}^{n}
$$

其中 $Z=1$ 表示第一个回答更受偏好，$Z=0$ 表示第二个回答更受偏好。

偏好学习的核心就是：如何从这些 pairwise preference 数据中学出一个更符合人类偏好的策略。

## 2. 当前问题：RLHF 和 DPO 为什么还不够稳

论文认为，现有对齐算法有一个共同软肋：它们对某些模型假设非常敏感。只要假设错了，训练就可能出问题。

### 2.1 奖励模型错设

PPO-based RLHF 通常先训练 reward model，再优化：

$$
\mathbb{E}_{X \sim D, y \sim \pi(\cdot|X)}[\hat r(y, X)]
- \beta D_{KL}[\pi(\cdot|X) \| \pi_{ref}(\cdot|X)]
$$

这里 $\hat r$ 是估计出来的奖励模型，$\pi_{ref}$ 是参考策略，$\beta$ 控制当前策略不要偏离参考策略太远。

问题在于，PPO 的优化目标非常依赖 $\hat r$。如果奖励模型学偏了，策略优化会放大这个偏差。模型可能学会钻奖励模型的空子，也就是 reward hacking。例如奖励模型喜欢某些表面特征，策略就反复生成这些特征，而不是真正提升回答质量。

### 2.2 Bradley-Terry 偏好模型错设

很多 RLHF 和 DPO 方法默认使用 Bradley-Terry 模型。它假设存在一个潜在奖励函数 $r^*$，并且回答 $Y^{(1)}$ 优于 $Y^{(2)}$ 的概率为：

$$
g^*(X, Y^{(1)}, Y^{(2)})
= \sigma(r^*(Y^{(1)}, X) - r^*(Y^{(2)}, X))
$$

直觉上，BT 模型认为每个回答都有一个标量分数，两个回答的偏好概率只由分数差决定。

这个假设很优雅，也很方便，但真实人类偏好不一定这么简单。人类偏好可能存在：

- 非传递性：A 胜 B，B 胜 C，不一定 A 胜 C；
- 上下文依赖：不同 prompt、不同用户、不同任务下判断标准不同；
- 噪声和不一致：同一个人不同时间可能给不同判断，不同标注者也可能冲突；
- 多维价值冲突：有帮助、简洁、安全、礼貌之间不一定能压成一个单一标量。

如果真实偏好不满足 BT 模型，那么基于 BT 假设训练出来的 reward model 或 DPO loss 就会有系统偏差。

### 2.3 参考策略错设

DPO 的关键思想是利用 KL 正则下最优策略的闭式形式，把奖励写成：

$$
\hat r(y, x)
= \beta \log \frac{\hat \pi(y|x)}{\pi_{ref}(y|x)}
- C(x)
$$

这样就可以绕开显式 reward model，直接用偏好数据优化策略。DPO 的优点是简单、稳定、成本低，所以近年来非常流行。

但 DPO 把压力转移到了 $\pi_{ref}$ 上。它要求 reference policy 的概率估计比较可靠。如果偏好数据不是由这个参考策略生成的，或者数据来自多个模型混合，或者真实行为策略不可知，那么 reference policy 就可能被错设。

一旦 $\pi_{ref}$ 错了，DPO 中的 log-ratio 就会偏，策略优化也会偏。

## 3. 国内外研究现状：从 RLHF 到稳健偏好优化

围绕大模型偏好对齐，近几年的路线大致可以分成几类。

### 3.1 Reward-based RLHF

这一类以 InstructGPT、PPO-based RLHF 为代表。基本思路是先训练 reward model，再通过强化学习最大化奖励，同时用 KL 约束防止策略偏离初始模型太远。

优点是框架直观，能直接把人类偏好转成奖励信号。缺点是训练流程复杂，需要维护 SFT 模型、reward model、policy model、value model 等多个组件，而且 PPO 本身对超参数和奖励模型质量比较敏感。

### 3.2 Direct Preference Optimization

DPO 发现，在 KL 正则的 RLHF 目标下，可以把 reward 和 optimal policy 联系起来，从而把 RLHF 转化为一个二分类式的偏好优化问题。它不需要单独训练 reward model，也不需要在线采样做强化学习。

DPO 的出现让偏好对齐大大简化，因此很多后续方法都以 DPO 为基础，例如处理偏好噪声、提升鲁棒性、改变正负样本权重、合并 SFT 和偏好优化等。

但是 DPO 仍然依赖两个前提：

1. 偏好可以用 BT 模型解释；
2. reference policy 是可信的。

DRPO 这篇文章正是从这两个脆弱点继续往前推进。

### 3.3 Preference-based Alignment

另一条路线不再显式假设存在一个标量 reward，而是直接从 pairwise preference 出发优化策略。例如 IPO、Nash Learning from Human Feedback、General Preference Model 等。

这类方法的共同目标是减少对传统 reward model 的依赖，更直接地建模“回答 A 比回答 B 好”这个关系。

其中 IPO 的目标和 DRPO 在 population level 上比较接近，都是最大化策略相对参考策略的总偏好。但是 IPO 对 reference policy 的错设仍然敏感。

General Preference Model 则试图突破 BT 模型的表达能力，用更一般的偏好表示建模复杂偏好关系。但如果偏好模型本身错设，仍然会影响优化。

### 3.4 Doubly Robust 思想

Doubly robust 最早常见于因果推断、缺失数据、离线策略评估等领域。

以平均处理效应 ATE 为例，通常会估计两个模型：

1. 倾向得分模型，也就是某个样本接受某种处理的概率；
2. 结果回归模型，也就是给定样本和处理后结果的期望。

Doubly robust 估计器的厉害之处在于：只要这两个模型里有一个是对的，估计结果就仍然一致。如果两个都对，还能达到更高的统计效率。

DRPO 的作者把这个思想搬到了 RLHF 中：

- reference policy 类似倾向得分模型；
- preference model 类似结果回归模型；
- 偏好评估类似离线策略评估；
- 目标策略就是我们要微调出来的新语言模型。

这个类比是整篇论文的关键入口。

## 4. 作者提出了什么：DRPO 的整体框架

作者提出了 Doubly Robust Preference Optimization，简称 DRPO。

它分两层：

1. Doubly Robust Preference Evaluation：先构造一个稳健估计器，用于估计目标策略比参考策略更受偏好的概率。
2. Doubly Robust Preference Optimization：再把这个估计器作为目标函数的一部分，用来训练语言模型。

### 4.1 总偏好目标

给定一个目标策略 $\pi$，作者定义它相对于参考策略 $\pi_{ref}$ 的总偏好为：

$$
p^*(\pi)
= P(\pi \succ \pi_{ref})
= \mathbb{E}_{y \sim \pi(\cdot|X), y' \sim \pi_{ref}(\cdot|X)}
g^*(X, y, y')
$$

这表示：从目标策略采样一个回答，从参考策略采样一个回答，目标策略回答被偏好的概率。

如果 $p^*(\pi)$ 越大，说明策略 $\pi$ 相对参考策略越符合偏好。

因此，偏好优化可以理解为：

$$
\max_{\pi \in \Pi} p^*(\pi)
$$

当然，为了避免策略跑得太远，实际训练还会加 KL 正则：

$$
\max_{\pi \in \Pi}
\left\{
\hat p_{DR}(\pi)
- \beta \mathbb{E}_{X \sim D}
D_{KL}[\pi(\cdot|X) \| \hat \pi_{ref}(\cdot|X)]
\right\}
$$

这就是 DRPO 的总体优化形式。

## 5. 核心算法：从 DM、IS 到 DR

要理解 DRPO，必须先理解作者如何估计 $p^*(\pi)$。

### 5.1 Direct Method

Direct Method 的思路最简单：我先训练一个偏好模型 $\hat g$，让它预测：

$$
\hat g(X, y, y') \approx P(y \succ y'|X)
$$

然后直接用它估计目标策略回答相对参考回答的胜率：

$$
\hat p_{DM}(\pi)
= \frac{1}{2}
\mathbb{E}_{X \sim D, y \sim \pi(\cdot|X)}
[
\hat g(X, y, Y^{(1)})
+ \hat g(X, y, Y^{(2)})
]
$$

这个方法的优点是方差相对低，缺点也明显：如果 $\hat g$ 错了，估计就偏。

### 5.2 Importance Sampling

Importance Sampling 不依赖偏好模型，而是利用离线数据中真实观察到的偏好标签 $Z$。

因为离线数据中的回答来自参考策略 $\pi_{ref}$，但我们想评估目标策略 $\pi$，所以要用概率比修正分布差异：

$$
w(y, x) = \frac{\pi(y|x)}{\pi_{ref}(y|x)}
$$

作者证明：

$$
p^*(\pi)
= \frac{1}{2}
\mathbb{E}
[
w(Y^{(1)}, X)Z
+ w(Y^{(2)}, X)(1-Z)
]
$$

对应的估计器为：

$$
\hat p_{IS}(\pi)
= \frac{1}{2}
\mathbb{E}_{D}
\left[
\frac{\pi(Y^{(1)}|X)}{\hat \pi_{ref}(Y^{(1)}|X)}Z
+
\frac{\pi(Y^{(2)}|X)}{\hat \pi_{ref}(Y^{(2)}|X)}(1-Z)
\right]
$$

这个方法的优点是只要 reference policy 准，就可以修正离线分布。缺点是概率比可能非常大，导致高方差；如果 $\hat \pi_{ref}$ 错了，估计也会偏。

### 5.3 Doubly Robust Estimator

DR 的关键是把 DM 和 IS 组合起来。

论文构造的估计函数可以理解为：

$$
\psi
= \text{DM 预测项}
+ \text{IS ratio} \times \text{偏好残差项}
$$

更具体地说，它包含两部分。

第一部分是 DM：

$$
\frac{1}{2}
\sum_{a=1}^{2}
\mathbb{E}_{y \sim \pi(\cdot|X)}
[
\hat g(X, y, Y^{(a)})
]
$$

第二部分是 augmentation term：

$$
\frac{1}{2}
\sum_{a=1}^{2}
(-1)^{a-1}
\frac{\pi(Y^{(a)}|X)}{\hat \pi_{ref}(Y^{(a)}|X)}
[
Z - \hat g(X, Y^{(1)}, Y^{(2)})
]
$$

最终：

$$
\hat p_{DR}(\pi)
= \mathbb{E}_{D}
[
\psi(X, Y^{(1)}, Y^{(2)}, Z; \pi, \hat \pi_{ref}, \hat g)
]
$$

这个公式看起来复杂，但直觉很清楚：

- $\hat g$ 给出一个偏好预测；
- $Z - \hat g$ 表示真实偏好标签和模型预测之间的残差；
- 如果偏好模型预测错了，残差项会用 IS ratio 做纠偏；
- 如果 reference policy 是对的，这个纠偏在期望上能抵消偏好模型的偏差；
- 如果偏好模型本来就是对的，残差项期望为 0，即使 reference policy 不准，整体也仍然一致。

这就是 doubly robust 的核心：偏好模型和参考策略不必同时正确，只要有一个正确，估计就能收敛到真实目标。

## 6. 为什么这样做可以解决问题

作者这样做能解决问题，本质上是因为 DR 估计器把误差结构从“一阶依赖”变成了“乘积依赖”。

论文中的 MSE 结论可以概括为：

$$
MSE(\hat p_{DR})
= SEB
+ O\left(\frac{1}{n}\|\hat g - g^*\|\right)
+ O\left(\frac{1}{n}\|\frac{\hat \pi_{ref}}{\pi_{ref}} - 1\|\right)
+ O\left(
\|\frac{\hat \pi_{ref}}{\pi_{ref}} - 1\|^2
\cdot
\|\hat g - g^*\|^2
\right)
$$

最重要的是最后一项：偏差项依赖的是两个误差的乘积。

这意味着：

- 如果 $\hat g = g^*$，那么偏好模型误差为 0，乘积项为 0；
- 如果 $\hat \pi_{ref} = \pi_{ref}$，那么参考策略误差为 0，乘积项也为 0；
- 如果两个都不完美，但都比较接近真实模型，乘积误差会比单个误差更小。

相比之下，PPO 的误差更直接依赖 reward model 的误差，DPO 的误差更直接依赖 reference policy 的误差。DRPO 把这种依赖变成了两者的乘积，所以理论上更稳。

作者进一步证明，在 BT 模型成立时，DRPO 的 suboptimality gap 形式为：

$$
O\left(
\beta
+ \sqrt{\frac{v}{n}}
+ \frac{v}{n}
+ \|\frac{\hat \pi_{ref}}{\pi_{ref}} - 1\|
\|\hat r - r^*\|
\right)
$$

而 PPO 更像：

$$
O\left(
\beta
+ \sqrt{\frac{v}{n}}
+ \frac{v}{n}
+ \|\hat r - r^*\|
\right)
$$

DPO 更像：

$$
O\left(
n^{-1/2}\log n
+ \|\frac{\hat \pi_{ref}}{\pi_{ref}} - 1\|
\right)
$$

也就是说，PPO 主要怕 reward model 错，DPO 主要怕 reference policy 错，而 DRPO 同时利用两者，单边错设时仍然可以稳住。

## 7. 训练实现细节

理论上的 DRPO 目标是：

$$
J(\pi_\theta; \hat \pi_{ref}, \hat g, D)
= \hat p_{DR}(\pi)
- \beta
\mathbb{E}_{X \sim D}
D_{KL}[\pi(\cdot|X) \| \hat \pi_{ref}(\cdot|X)]
$$

实际实现中有几个重要技巧。

### 7.1 离线数据扩增

原始偏好数据是：

$$
(X, Y^{(1)}, Y^{(2)}, Z)
$$

作者会加入交换后的样本：

$$
(X, Y^{(2)}, Y^{(1)}, 1-Z)
$$

这样可以利用 pairwise comparison 的对称性，让每个样本同时贡献正反两个方向的信息，也能简化 loss 的写法。

### 7.2 当前策略采样

DM 项里需要：

$$
y \sim \pi_\theta(\cdot|X)
$$

所以训练时会从当前策略为每个 prompt 采样若干回答 $Y^*$，再用偏好模型 $\hat g$ 比较 $Y^*$ 和离线数据中的回答。

这一步的作用是让策略直接学习“生成能赢过参考回答的回答”，而不只是提高离线 chosen response 的概率。

### 7.3 IS ratio clipping

重要性采样比率：

$$
\frac{\pi_\theta(Y|X)}{\hat \pi_{ref}(Y|X)}
$$

可能非常大，尤其当目标策略和参考策略差异很大时。为了控制方差，作者对 ratio 做 clipping：

$$
clip\left(
\frac{\pi_\theta(Y|X)}{\hat \pi_{ref}(Y|X)},
1-\epsilon_1,
1+\epsilon_2
\right)
$$

这和 PPO 中 clipping 的动机有点像，都是为了避免单个样本的梯度影响过大。

### 7.4 Stop-gradient

作者还会对 IS ratio 相关项使用 stop-gradient。直觉上，这样可以避免模型通过操纵 ratio 本身产生不稳定梯度，同时保留近似的数值修正作用。

最终的 loss 可以概括成：

$$
L_{DRPO}
= -\frac{1}{2}
\left[
\text{偏好模型引导项}
+ \text{stop-gradient 的残差纠偏项}
\right]
+ \beta \text{KL项}
$$

优化时最小化这个 loss，就等价于最大化 DRPO 目标。

## 8. 实验结果怎么理解

论文做了两类实验：偏好评估和偏好优化。

### 8.1 IMDb：验证 doubly robust 性质

IMDb 实验是一个可控的合成偏好场景。作者使用情感分类器构造 ground-truth preference model，然后比较四种情况：

1. 偏好模型正确，参考策略正确；
2. 偏好模型错误，参考策略正确；
3. 偏好模型正确，参考策略错误；
4. 偏好模型错误，参考策略错误。

结果很符合 doubly robust 的预期：

- 两个都错时，MSE 最大；
- 任意一个正确时，MSE 明显下降；
- 两个都正确时，MSE 最低，并接近半参数效率界。

这说明 DR 估计器确实不是只在理论上漂亮，而是在可控实验中体现出了单边稳健性。

### 8.2 TL;DR：摘要任务

TL;DR 是 Reddit 长帖摘要任务。论文认为这个数据集适合观察 reference policy misspecification，因为使用的 SFT 模型来自过滤后的数据子集，和真实偏好数据的行为分布不完全一致。

结果中，DRPO-BT 和 DRPO-GPM 都明显优于 PPO、DPO 以及多个 DPO 变体。表格中 DRPO-BT 相对一些方法的胜率包括：

- 对 Dr. DPO：72.5%
- 对 rDPO：65.0%
- 对 cDPO：63.5%
- 对 CPO：90.0%
- 对 IPO：98.5%

这说明当 reference policy 可能错设时，DRPO 的纠偏机制确实有优势。

### 8.3 HH：有帮助和无害对话

HH 数据更适合观察 preference model misspecification，因为先前研究认为 HH 中存在 BT 模型难以刻画的 pairwise noise。

实验中：

- DRPO-GPM 在分布内表现最好；
- DRPO-BT 优于 PPO，并和 DPO 接近；
- 分布外 AlpacaEval 上，DRPO 和一些鲁棒 DPO 变体接近，并优于部分其他方法。

这也符合直觉：如果真实偏好关系不太符合 BT，那么使用更一般的 GPM 作为偏好模型会更有帮助。

## 9. 这篇论文的核心思想

我觉得这篇论文的核心思想可以用一句话概括：

> 不要赌某一个模型一定正确，而是把两个互补模型组合起来，让一个模型在另一个模型出错时提供纠偏。

在 RLHF 中，这两个模型就是：

- 偏好模型 $\hat g$：负责直接判断回答好坏；
- 参考策略 $\hat \pi_{ref}$：负责告诉我们离线数据来自什么分布，以及目标策略和数据分布之间差了多少。

Direct Method 只相信偏好模型。Importance Sampling 只相信参考策略。DRPO 同时使用两者：

- 偏好模型给低方差的主估计；
- IS ratio 乘以残差，修正偏好模型偏差；
- KL 正则控制策略不要偏离太远；
- clipping 和 stop-gradient 保证训练稳定。

这就是为什么它能同时处理 preference model misspecification 和 reference policy misspecification。

## 10. 我的理解和评价

这篇论文最让我有收获的地方，是它没有把大模型对齐问题只看成“设计一个新 loss”，而是先回到统计估计问题：我们到底如何可靠地估计一个策略是否更符合偏好？

很多对齐算法其实默认了几个隐藏前提：

- 偏好数据来自已知参考策略；
- 偏好可以被标量 reward 解释；
- reward model 或 preference model 泛化足够好；
- 离线偏好数据能代表策略优化后的生成分布。

DRPO 的价值在于，它承认这些前提可能不成立，然后通过 doubly robust 的方式降低对单一前提的依赖。

不过它也不是万能的。作者自己也提到，IS ratio 仍然可能带来高方差。如果目标策略和参考策略差得太远，即使用 clipping，也可能损失一部分理论上的无偏性和稳定性。另外，实验没有覆盖更大规模模型，实际工程中计算成本、采样成本、偏好模型质量都会影响效果。

从工程角度看，DRPO 比 DPO 更复杂，因为它需要：

- reference policy 或其估计；
- preference model；
- 当前策略采样；
- IS ratio 计算；
- ratio clipping；
- KL 正则。

所以它更像是在 DPO 之后的一种稳健增强路线，而不是 DPO 的简单替代品。对于 reference policy 可信、BT 假设基本可接受的小任务，DPO 仍然可能是更简单的选择。但如果数据来源复杂、偏好模型可能错设、任务对安全和稳健性要求更高，DRPO 的思路就非常值得关注。

## 11. 参考资料

- Erhan Xu, Kai Ye, Hongyi Zhou, Luhan Zhu, Francesco Quinzan, Chengchun Shi. [Doubly Robust Alignment for Large Language Models](https://arxiv.org/abs/2506.01183), 2025.
- Rafael Rafailov et al. [Direct Preference Optimization: Your Language Model is Secretly a Reward Model](https://arxiv.org/abs/2305.18290), 2023.
- Mohammad Gheshlaghi Azar et al. [A General Theoretical Paradigm to Understand Learning from Human Preferences](https://arxiv.org/abs/2310.12036), 2023.
- Zhang et al. [Beyond Bradley-Terry Models: A General Preference Model for Language Model Alignment](https://arxiv.org/abs/2410.02197), 2024.
- DRPO 官方代码仓库：[DRPO4LLM/DRPO4LLM](https://github.com/DRPO4LLM/DRPO4LLM)
