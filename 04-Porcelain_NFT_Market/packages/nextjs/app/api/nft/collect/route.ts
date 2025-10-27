import { NextResponse } from 'next/server';
import db from '../../../../utils/db';

// 处理NFT收藏
export async function POST(request: Request) {
  try {
    const { nft_id, user_address, collected_at } = await request.json();
    
    // 检查参数
    if (!nft_id || !user_address || !collected_at) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { 
        status: 400 
      });
    }

    // 格式化日期时间为MySQL可接受的格式 (UTC+8)
    const date = new Date(collected_at);
    date.setHours(date.getHours() + 8); // 调整为东八区
    const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');

    // 插入或删除收藏记录
    const query = `
      INSERT INTO nft_collections (
        nft_id, 
        user_address, 
        collected_at
      )
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        collected_at = VALUES(collected_at)
    `;

    await db.query(query, [nft_id, user_address, formattedDate]);

    return NextResponse.json({
      success: true,
      message: '收藏操作成功'
    });
  } catch (error) {
    console.error('收藏操作失败:', error);
    return NextResponse.json({
      success: false,
      error: '收藏操作失败'
    }, { 
      status: 500 
    });
  }
}

// 获取收藏状态
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nft_id = searchParams.get('nft_id');
    const user_address = searchParams.get('user_address');

    if (!nft_id || !user_address) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { 
        status: 400 
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM nft_collections WHERE nft_id = ? AND user_address = ?',
      [nft_id, user_address]
    );

    return NextResponse.json({
      success: true,
      isCollected: rows.length > 0
    });
  } catch (error) {
    console.error('获取收藏状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取收藏状态失败'
    }, { 
      status: 500 
    });
  }
} 