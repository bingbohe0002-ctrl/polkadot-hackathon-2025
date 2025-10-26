# Life++ PoC Sprint Backlog

## Phase 0: 基础架构搭建 (Week 1)

### ✅ 已完成
- [x] 项目目录结构创建
- [x] 合约拆分到 `contracts/*.sol`
- [x] 脚本提取到 `scripts/`
- [x] 测试用例提取到 `test/`
- [x] TypeScript 服务拆分
- [x] 配置文件创建 (package.json, tsconfig.json, .env.example)
- [x] Docker Compose 配置

### 🔄 进行中
- [ ] 本地环境测试
- [ ] 依赖安装验证
- [ ] 合约编译测试

### 📋 待办
- [ ] E2E 冒烟测试
- [ ] 故障排除文档完善

## Phase 1: 本地开发环境 (Week 2)

### 目标
- 完成本地一键启动
- 跑通完整 Demo 流程
- 验证所有服务集成

### 任务清单
- [ ] Docker 服务启动测试
- [ ] 合约部署脚本验证
- [ ] AHIN Indexer 服务测试
- [ ] Validator Daemon 集成测试
- [ ] Robot SDK 示例运行
- [ ] 端到端流程验证

### 验收标准
- `npm run docker:up` 成功启动所有服务
- `npm run deploy` 成功部署合约
- `npm run demo` 成功提交 proof
- 验证者成功 attest proof

## Phase 2: 测试网部署 (Week 3+)

### 目标
- 部署到 Polkadot Asset Hub 测试网
- 验证链上功能
- 监控和日志系统

### 任务清单
- [ ] 测试网配置
- [ ] 合约部署到测试网
- [ ] 服务配置更新
- [ ] 监控系统搭建
- [ ] 性能测试

### 验收标准
- 测试网合约部署成功
- 服务正常运行
- 监控数据正常

## Phase 3: 生产优化 (未来)

### 目标
- 生产级部署
- 安全审计
- 性能优化

### 任务清单
- [ ] 安全审计
- [ ] 性能优化
- [ ] 监控告警
- [ ] 文档完善

## 风险与缓解

### 高风险
- IPFS 客户端兼容性问题
- 事件 ABI 不一致
- 时间窗口限制

### 缓解措施
- 统一 IPFS 客户端处理
- 严格 ABI 测试
- 合理时间窗口配置

## 技术债务

### 短期
- 错误处理完善
- 日志系统标准化
- 配置管理优化

### 长期
- 监控系统集成
- 安全审计
- 性能优化
