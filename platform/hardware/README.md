# 🔧 Hardware

硬件能力抽象层。

## 🎯 Role

抽象 GPU / NPU / AI 加速芯片等硬件能力，让上层无需关心具体硬件型号。

## ✅ Responsibility

- GPU / NPU 可用性检测
- 设备能力枚举
- AI-on-chip 适配接口
- 硬件加速调度提示

## 🚧 Boundaries

- 不实现具体模型推理
- 不包含驱动安装逻辑
