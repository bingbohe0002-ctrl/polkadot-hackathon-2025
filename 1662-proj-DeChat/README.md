Dechat-基于XMTP的原生聊天室（支持NFT门禁+群聊红包）
# Dechat — 链上社群互动，NFT 门禁与红包体验

## 一、项目介绍：
本项目基于 XMTP 通讯协议 构建去中心化群聊工具，结合 NFT 权限验证 与 数字红包激励机制，为 Web3 社区带来全新的互动体验。
用户可以通过点击邀请链接或扫描二维码的方式加入群聊。系统会自动验证用户是否持有指定 NFT，只有符合条件的用户才可入群，从而实现基于 NFT 身份的私域社群管理。
群聊中，用户可发送或领取 链上红包（Token Red Packet）。红包资金直接从发送者的钱包划转，领取后资产自动进入用户钱包，确保全程去中心化与安全可信。
红包设有 普通红包、高级红包与超级红包 三个等级，对应不同的 NFT 等级。NFT 等级越高，用户即可解锁更高级别的红包权益，实现身份即权益的创新激励机制。
Project Overview
This project is a decentralized group chat tool built on the XMTP communication protocol, integrating NFT-based access control and on-chain red packet incentives, bringing a new level of interaction to Web3 communities.
Users can join groups by clicking an invitation link or scanning a QR code. The system automatically verifies whether the user holds the specified NFT, granting access only to eligible users, thus enabling private community management based on NFT identity.
Within the group, users can send and receive on-chain token red packets. The funds are directly transferred from the sender’s wallet, and received tokens are instantly credited to the recipient’s wallet, ensuring a fully decentralized and secure experience.
Red packets are available in Normal, Advanced, and Super tiers, corresponding to different NFT levels. The higher the NFT level, the more exclusive red packet rewards a user can unlock, realizing an innovative mechanism where identity equals benefits.
## 二、Dechat 功能亮点
- 扫码/链接入群：轻松加入专属群聊
- NFT 门禁：持 NFT 才可入群，身份即权益
- 即时群聊：去中心化消息，安全可靠
- 链上红包：数字资产直接打入红包，领取即时到账
- 红包等级：普通 / 高级 / 超级，NFT 等级决定可领红包等级
- 互动激励：红包与 NFT 联动，提升社群活跃度

## 三、技术概览
- XMTP：去中心化消息协议，用于实现原生群聊和链上安全通信。
- Polkadot：底层区块链网络，管理 NFT 资产和链上红利，实现跨链和去中心化存储。
- React：前端框架，用于构建高性能、响应式的用户界面。
- 数字钱包集成：支持用户发送/领取链上红包，保证资产即时到账。

## 四、技术框架
<img width="1280" height="1028" alt="image" src="https://github.com/user-attachments/assets/9cb9995b-dcd8-434f-8b46-eaac0d373e35" />

## 五、项目结构及使用说明
1. 前端：../1662-proj-DeChat/ DeChatFront ； 启动命令：npm start
2. xmtp：使用"XMPT V3 Browser SDK"
https://docs.xmtp.org/chat-apps/sdks/browser#get-started-with-the-xmtp-browser-sdk
3. 合约: ../1662-proj-DeChat/ contract
   ① NFT合约地址：0x9E8e3572363469eA1bEdd9a9a674C723CAD7b002
   ② 红包合约地址：0xbC2d5f073fb937c67A70E3F0CbbF9dF061edf592
4. 服务： ../1662-proj-DeChat/ server/ InviteGroupMemberServer.ts ；启动命令：npx ts-node '../1662-proj-DeChat/ server/ InviteGroupMemberServer.ts '
5. 区块链：Polkadot  PVM

## 六、交互说明
1. 交互预览
 <img width="1918" height="1408" alt="image" src="https://github.com/user-attachments/assets/9b97e959-7b33-47bd-97e8-d24b8e46cad3" />
2. NFT及红包形象：
<img width="1544" height="676" alt="image" src="https://github.com/user-attachments/assets/d6307e3f-2ace-4f5e-bdf2-02a1386a5a17" />

## 七、操作说明：
1.登录 <img width="1280" height="544" alt="image" src="https://github.com/user-attachments/assets/dba6aae9-d3cc-4229-887f-92158e04f52b" />
2.创建群组：<img width="1280" height="589" alt="image" src="https://github.com/user-attachments/assets/59df33d7-01c4-469b-b6ab-b437b1c7cac2" />
3.邀请入群：<img width="1280" height="405" alt="image" src="https://github.com/user-attachments/assets/59e99ce3-8465-40fe-a8c0-e2ed911c4c8c" />
4.发送链上红包：<img width="1280" height="903" alt="image" src="https://github.com/user-attachments/assets/721884db-9b73-4fc5-ab6c-97da5fdf7c50" />
5.群聊信息：<img width="1280" height="718" alt="image" src="https://github.com/user-attachments/assets/b7f2e3a8-5889-4c41-9371-9b1d0e62f3ff" />
