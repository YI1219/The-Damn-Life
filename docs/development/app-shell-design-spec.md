# UI 设计规范 — The Damn Life

> **适用范围**：`apps/app-shell`（及未来所有 The Damn Life 前端界面）  
> **AI vibe coding 必读**：所有新生成的 UI 代码必须遵循本规范，不得引入自定义 UI 组件库（Ant Design、MUI、shadcn 等），不得覆盖本规范中的 token。

---

## 1. 设计原则

| 原则 | 含义 |
|------|------|
| **系统原生优先** | 使用 `system-ui` 字体，颜色贴近 macOS/Windows 原生控件，减少视觉噪声 |
| **克制** | 无阴影堆叠、无渐变炫彩、无动效炫技；只在必要时使用视觉强调 |
| **密度适中** | 面向桌面端，不追求移动端大号触控，信息密度可以略高 |
| **权限可见** | 所有出站操作必须有显式用户确认，危险状态必须用红色标出 |
| **终端感** | 日志区域保持暗色终端风格，主界面保持亮色，形成视觉分层 |

---

## 2. 色彩 Token

> 直接使用 CSS 变量，在 `:root` 中声明，**禁止在组件内硬编码颜色值**（`App.css` 中已定义）。

```css
:root {
  /* 主色 — 操作确认、链接、主按钮 */
  --color-primary: #0ea5e9;         /* sky-500 */
  --color-primary-hover: #0284c7;   /* sky-600 */

  /* 危险 / 错误 */
  --color-danger: #b91c1c;          /* red-700 */
  --color-danger-bg: #fef2f2;       /* red-50 */

  /* 文本 */
  --color-text: #111;               /* 正文 */
  --color-text-muted: #444;         /* 次要说明文字 */
  --color-text-on-primary: #fff;    /* 主色按钮上的文字 */

  /* 背景 */
  --color-bg: #fff;                 /* 页面 / 卡片背景 */
  --color-bg-subtle: #f6f7f9;       /* 代码块、输入辅助背景 */
  --color-bg-overlay: rgba(0,0,0,0.55); /* 模态遮罩 */

  /* 日志终端区 */
  --color-log-bg: #111;
  --color-log-text: #e8e8e8;

  /* 边框 */
  --color-border: #e5e7eb;          /* gray-200 */
}
```

---

## 3. 字体

```css
/* 正文 / UI */
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 代码 / 终端 / ID / URL */
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

| 用途 | `font-size` | `font-weight` |
|------|-------------|---------------|
| 页面标题 `<h1>` | `1.25rem` | `650` |
| 区块标题 `<h2>` | `1rem` | `650` |
| 正文 | `1rem` | `400` |
| 辅助说明 `.hint` | `0.9rem` | `400` |
| 代码 / mono inline | `0.92em` | `400` |
| 日志终端 `.log` | `0.8rem` | `400` |

---

## 4. 间距

以 `0.25rem`（4px）为基础单位，常用值：

| Token 名称 | 值 | 用途 |
|------------|----|------|
| `--space-1` | `0.25rem` | 紧凑元素内边距 |
| `--space-2` | `0.5rem` | 按钮 padding-x，小间距 |
| `--space-3` | `0.75rem` | 卡片内边距，日志区 padding |
| `--space-4` | `1rem` | 页面主内边距，表单行间距 |
| `--space-5` | `1.25rem` | 页面水平 padding |

---

## 5. 圆角

| 场景 | `border-radius` |
|------|-----------------|
| 输入框、小按钮 | `6px` |
| 代码块、辅助背景区 | `10px` |
| 模态框、卡片 | `12px` |

---

## 6. 阴影

只用于模态框（对话框需要脱离页面流的视觉层级），其他元素**不加阴影**。

```css
/* 模态框 */
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
```

---

## 7. 组件规范

### 7.1 按钮

```css
/* 默认按钮 */
button {
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
}
button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 主操作按钮（confirm / connect） */
button.primary {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border-color: var(--color-primary);
  border-radius: 10px;
}
button.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

/* 危险按钮（disconnect / delete） */
button.danger {
  background: var(--color-danger);
  color: var(--color-text-on-primary);
  border-color: var(--color-danger);
  border-radius: 10px;
}
```

**原则：**
- 一排按钮最多 2 个，用 `.row { display: flex; gap: 0.5rem }` 排列
- 主操作永远在右，取消 / 次操作在左
- 危险操作（断开、删除）使用 `.danger`，不用 `.primary`

---

### 7.2 输入框 `<input>`

```css
input[type="text"],
input[type="url"],
input[type="number"] {
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: inherit;
  font-size: inherit;
  background: var(--color-bg);
  color: var(--color-text);
}
input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
  border-color: transparent;
}
```

---

### 7.3 表单字段 `<label>`

```css
label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 1rem 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
/* 行内 checkbox */
label.inline-check {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
label.inline-check input { width: auto; }
```

**原则：**
- label 文字在 input 上方（column），行内 checkbox 用 `inline-check`
- placeholder 文字只用于补充说明，不替代 label

---

### 7.4 辅助文本 `.hint`

```html
<p className="hint">普通说明文字</p>
<p className="hint danger">危险状态或错误提示</p>
```

- 不超过 2 行；超出请用独立段落或 `.log` 区
- 内嵌 `<code>` 用于 ID、URL、键名显示
- 内嵌 `<strong>` 用于关键词强调

---

### 7.5 日志终端 `.log`

```css
.log {
  background: var(--color-log-bg);
  color: var(--color-log-text);
  padding: var(--space-3);
  min-height: 12rem;
  max-height: 24rem;
  overflow: auto;
  font-family: ui-monospace, ...;
  font-size: 0.8rem;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
}
```

- 使用 `useEffect` + `scrollTop = scrollHeight` 自动滚动到末尾
- **不做语法高亮**，保持纯文本
- 每行 `[timestamp] message` 格式（可选）

---

### 7.6 模态确认框 `<ConfirmModal>`

结构固定，**禁止新增自定义模态组件**，统一复用 `platform/web/components/ConfirmModal.tsx`。

```
┌──────────────────────────────┐
│ Title（font-weight: 650）    │
│                              │
│ ┌──────────────────────────┐ │
│ │ pre.tdl-modal-message    │ │  ← bg-subtle, max-h 40vh scroll
│ └──────────────────────────┘ │
│                  [取消] [允许]│
└──────────────────────────────┘
```

- 遮罩点击 = 取消；`Escape` = 取消
- 宽度 `min(44rem, 92vw)`
- 只有两个行动按钮：默认（取消）在左，primary（允许）在右
- message 内容用 `<pre>` 保留换行，通过 `textContent` / `{children}` 写入（防 XSS）

---

### 7.7 页面布局

```css
.host-panel {   /* 或任意页面根容器 */
  padding: var(--space-4) var(--space-5);   /* 1rem 1.25rem */
  max-width: 52rem;
}
```

- 单列布局，不用 Grid / Flex 多列（当前阶段）
- 页面宽度上限 `52rem`，居左不居中
- 不使用 sidebar / navbar（Tauri 原生窗口已提供边框）

---

## 8. 命名约定

| 类型 | 格式 | 示例 |
|------|------|------|
| CSS class（BEM-lite） | `tdl-<block>` 或 `<block>-<modifier>` | `tdl-modal`, `hint danger` |
| React 组件文件 | PascalCase `.tsx` | `ConfirmModal.tsx` |
| Hook 文件 | `use` 前缀 camelCase `.ts` | `useRelaySession.ts` |
| CSS 文件 | 与组件同名 | `App.css` |

---

## 9. 禁止事项

- ❌ 引入第三方 UI 组件库（Ant Design、MUI、Radix、shadcn、Chakra…）
- ❌ 使用 Tailwind utility class（本项目用 plain CSS + token）
- ❌ 内联 `style={{ }}` 属性（除非动态值无法用 class 表达）
- ❌ `document.createElement` / `innerHTML` 操作 DOM（已用 React 重构）
- ❌ 在组件内硬编码颜色值（统一走 CSS 变量）
- ❌ 新增页面级动画效果（`transition`、`animation` 均需讨论后引入）

---

## 10. 快速参考卡（AI Prompt Cheatsheet）

AI 生成新界面时，直接引用以下约束：

```
技术栈：React 19 + plain CSS（无 UI 库）  
入口位置：apps/app-shell/platform/web/  
共享逻辑：apps/app-shell/src/bridge/  
主色：#0ea5e9（sky-500）  
危险色：#b91c1c  
字体：system-ui 正文 / ui-monospace 代码  
模态：复用 ConfirmModal.tsx，不新建  
日志区：.log class，暗色终端风格  
布局：单列，max-width: 52rem，无 sidebar  
CSS 变量：见 App.css :root  
禁止：Tailwind / 第三方组件库 / 内联 style / innerHTML  
```
