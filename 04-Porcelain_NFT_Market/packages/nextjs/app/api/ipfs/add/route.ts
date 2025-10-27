// import { ipfsClient } from "~~/utils/simpleNFT/ipfs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = JSON.stringify(body);
    // 检查是否设置了 API key 和 secret
    const pinataAPIKEY = process.env.PINATA_API_KEY;
    const pinataAPISECRET = process.env.PINATA_API_SECRET;

    if (!pinataAPIKEY || !pinataAPISECRET) {
      return Response.json({ error: "API key or secret is not set in environment variables" }, { status: 400 });
    }

    console.log("APIKEY===========>", pinataAPIKEY)
    console.log("APISECRET===========>", pinataAPISECRET)
    console.log("data===========>", data)

    // 创建一个 AbortController 实现超时功能
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 设置超时时间为 5 秒

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataAPIKEY,
        'pinata_secret_api_key': pinataAPISECRET,
      },
      body: data,
      signal: controller.signal, // 添加 signal 以支持超时中断
    });

    clearTimeout(timeout); // 请求完成后清除超时计时器
    
    // const res = await ipfsClient.add(JSON.stringify(body));
    
    // 检查 Pinata API 的响应
    if (!response.ok) {
      const errorResponse = await response.json();
      return Response.json({ error: "Error pinning to IPFS", details: errorResponse }, { status: response.status });
    }

    // 获取并返回响应结果
    const res = await response.json();
    return Response.json(res);
  } catch (error) {
    console.log("Error adding to ipfs", error);
    return Response.json({ error: "Error adding to ipfs" });
  }
}
