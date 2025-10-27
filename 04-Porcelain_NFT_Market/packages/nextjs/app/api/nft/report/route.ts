import { NextResponse } from 'next/server';
import db from '../../../../utils/db';

// 处理NFT举报
export async function POST(request: Request) {
  try {
    const { nft_id, reporter_address, reason, reported_at } = await request.json();
    
    // 检查参数
    if (!nft_id || !reporter_address || !reason || !reported_at) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { 
        status: 400 
      });
    }

    // 检查是否已经举报过
    const [existingReports] = await db.query(
      'SELECT * FROM nft_reports WHERE nft_id = ? AND reporter_address = ?',
      [nft_id, reporter_address]
    );

    if (existingReports.length > 0) {
      return NextResponse.json({
        success: false,
        error: '您已经举报过该数藏'
      }, { 
        status: 400 
      });
    }

    // 格式化日期时间为MySQL可接受的格式 (UTC+8)
    const date = new Date(reported_at);
    date.setHours(date.getHours() + 8); // 调整为东八区
    const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');

    // 插入举报记录
    const query = `
      INSERT INTO nft_reports (
        nft_id, 
        reporter_address, 
        reason, 
        reported_at,
        status
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      nft_id,
      reporter_address,
      reason,
      formattedDate,
      'pending'
    ]);

    return NextResponse.json({
      success: true,
      message: '举报成功'
    });
  } catch (error) {
    console.error('举报失败:', error);
    return NextResponse.json({
      success: false,
      error: '举报失败'
    }, { 
      status: 500 
    });
  }
}

// 获取举报列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nft_id = searchParams.get('nft_id');

    let query = 'SELECT * FROM nft_reports';
    let params = [];

    if (nft_id) {
      query = 'SELECT * FROM nft_reports WHERE nft_id = ?';
      params = [nft_id];
    }

    const [rows] = await db.query(query, params);

    return NextResponse.json({
      success: true,
      reports: rows
    });
  } catch (error) {
    console.error('获取举报列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取举报列表失败'
    }, { 
      status: 500 
    });
  }
} 