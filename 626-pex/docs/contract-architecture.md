# 合约架构设计

## 系统概览

PolkaVM Perpetual DEX 采用模块化的智能合约架构，实现完全链上的永续合约交易。

## 合约间交互流程

```mermaid
graph TB
    User[用户] --> OrderBook[OrderBook.sol]
    User --> MarginVault[MarginVault.sol]
    
    OrderBook --> PerpMarket[PerpMarket.sol]
    OrderBook --> RiskEngine[RiskEngine.sol]
    
    PerpMarket --> MarginVault
    PerpMarket --> RiskEngine
    PerpMarket --> FeeCollector[FeeCollector.sol]
    
    RiskEngine --> MarginVault
    RiskEngine --> OracleAdapter[OracleAdapter.sol]
    
    Governance[Governance.sol] --> OrderBook
    Governance --> PerpMarket
    Governance --> RiskEngine
    Governance --> FeeCollector
    
    OracleAdapter --> Chainlink[Chainlink Oracle]
    OracleAdapter --> DIA[DIA Oracle]
    
    subgraph "核心交易流程"
        OrderBook
        PerpMarket
        MarginVault
        RiskEngine
    end
    
    subgraph "治理与费用"
        Governance
        FeeCollector
    end
    
    subgraph "价格数据"
        OracleAdapter
        Chainlink
        DIA
    end
```

## 交易流程详细图

```mermaid
sequenceDiagram
    participant User as 用户
    participant OB as OrderBook
    participant PM as PerpMarket
    participant MV as MarginVault
    participant RE as RiskEngine
    participant OA as OracleAdapter

    User->>MV: 1. 存入保证金
    MV-->>User: 确认存入

    User->>OB: 2. 下单 (placeOrder)
    OB->>MV: 3. 检查保证金
    MV-->>OB: 保证金充足
    
    OB->>OB: 4. 存储订单
    OB->>OB: 5. 尝试撮合
    
    alt 撮合成功
        OB->>PM: 6. 通知成交
        PM->>MV: 7. 更新仓位
        PM->>RE: 8. 风险检查
        RE->>OA: 9. 获取价格
        OA-->>RE: 当前价格
        RE-->>PM: 风险评估
        PM-->>OB: 成交确认
        OB-->>User: 成交通知
    else 撮合失败
        OB-->>User: 订单挂起
    end

    Note over RE: 持续监控风险
    RE->>OA: 定期获取价格
    alt 触发清算
        RE->>PM: 执行清算
        PM->>MV: 更新保证金
        PM-->>RE: 清算完成
    end
```

## 资金费率计算流程

```mermaid
graph LR
    A[市场数据] --> B[计算资金费率]
    B --> C{费率是否合理?}
    C -->|是| D[更新费率]
    C -->|否| E[调整参数]
    E --> B
    D --> F[广播费率更新]
    F --> G[用户支付/收取费率]
    
    subgraph "资金费率组件"
        H[PerpMarket] --> I[计算持仓不平衡]
        I --> J[应用费率公式]
        J --> K[更新累计费率]
    end
```

## 清算机制流程

```mermaid
graph TD
    A[RiskEngine监控] --> B{检查保证金比率}
    B -->|健康| C[继续监控]
    B -->|不足| D[标记清算]
    
    D --> E[计算清算价格]
    E --> F[执行清算]
    F --> G[更新仓位]
    G --> H[分配清算奖励]
    H --> I[释放保证金]
    
    C --> A
    I --> A
    
    subgraph "清算参与者"
        J[清算机器人]
        K[套利者]
        L[协议保险基金]
    end
    
    F --> J
    F --> K
    F --> L
```

## 治理流程

```mermaid
graph TB
    A[提案创建] --> B[社区讨论]
    B --> C[投票期开始]
    C --> D{投票结果}
    D -->|通过| E[执行提案]
    D -->|拒绝| F[提案失败]
    
    E --> G[更新合约参数]
    G --> H[生效通知]
    
    subgraph "可治理参数"
        I[手续费率]
        J[资金费率参数]
        K[清算阈值]
        L[最大杠杆]
        M[市场参数]
    end
    
    G --> I
    G --> J
    G --> K
    G --> L
    G --> M
```

## 数据流架构

```mermaid
graph LR
    subgraph "链上数据"
        A[合约事件]
        B[状态变更]
        C[交易记录]
    end
    
    subgraph "索引层"
        D[Subsquid Indexer]
        E[GraphQL API]
        F[REST API]
    end
    
    subgraph "前端应用"
        G[Trading Interface]
        H[Portfolio Dashboard]
        I[Analytics]
    end
    
    subgraph "实时数据"
        J[WebSocket Gateway]
        K[Price Feed]
        L[Order Updates]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> E
    D --> F
    
    E --> G
    F --> H
    F --> I
    
    J --> G
    K --> G
    L --> G
```

## 安全机制

```mermaid
graph TD
    A[多重签名钱包] --> B[合约升级]
    A --> C[紧急暂停]
    
    D[时间锁] --> B
    D --> E[参数变更]
    
    F[预言机验证] --> G[价格安全]
    G --> H[防止操纵]
    
    I[保险基金] --> J[系统风险覆盖]
    J --> K[极端市场保护]
    
    L[审计机制] --> M[代码安全]
    M --> N[漏洞防护]
    
    subgraph "风险控制"
        O[实时监控]
        P[异常检测]
        Q[自动熔断]
    end
    
    O --> P
    P --> Q
    Q --> C
```

## 性能优化策略

1. **Gas 优化**
   - 批量操作减少交易次数
   - 状态变量打包存储
   - 事件日志优化

2. **撮合效率**
   - 价格级别索引
   - 订单优先级队列
   - 批量撮合机制

3. **状态管理**
   - 增量更新策略
   - 缓存机制
   - 延迟计算

4. **扩展性设计**
   - 模块化架构
   - 可升级代理模式
   - 跨链兼容性预留