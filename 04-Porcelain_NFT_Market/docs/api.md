# API 文档

## NFT 相关接口

### 上传 NFT 元数据到 IPFS
```typescript
POST /api/ipfs/add
```
请求体:
```json
{
  "name": "NFT名称",
  "description": "NFT描述",
  "image": "图片文件",
  "attributes": [
    {
      "trait_type": "属性名",
      "value": "属性值"
    }
  ]
}
```
响应:
```json
{
  "success": true,
  "ipfsHash": "Qm..."
}
```

### 收藏 NFT
```typescript
POST /api/nft/collect
```
请求体:
```json
{
  "tokenId": "1",
  "userAddress": "0x..."
}
```

### 举报 NFT
```typescript
POST /api/nft/report
```
请求体:
```json
{
  "tokenId": "1",
  "reason": "举报原因",
  "reporterAddress": "0x..."
}
```

## Gas 费用记录

### 保存 Gas 记录
```typescript
POST /api/gas/save
```
请求体:
```json
{
  "tx_hash": "0x...",
  "method_name": "方法名",
  "gas_used": "使用的gas量",
  "gas_price": "gas价格",
  "total_cost": "总花费",
  "user_address": "0x...",
  "block_number": "区块号"
}
```

## IPFS 相关接口

### 从 IPFS 获取数据
```typescript
GET /api/ipfs/get?hash={ipfsHash}
```
响应:
```json
{
  "success": true,
  "data": {
    "name": "NFT名称",
    "description": "NFT描述",
    "image": "图片URL",
    "attributes": []
  }
}
```

### 上传文件到 IPFS
```typescript
POST /api/ipfs/upload
```
请求体:
- `Content-Type: multipart/form-data`
- `file`: 文件数据

响应:
```json
{
  "success": true,
  "ipfsHash": "Qm..."
}
``` 