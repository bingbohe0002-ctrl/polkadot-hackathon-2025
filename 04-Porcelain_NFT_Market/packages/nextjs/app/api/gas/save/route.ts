import { NextResponse } from 'next/server';
import db from '../../../../utils/db';

// 保存gas记录到数据库
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 解构需要的数据
    const { 
      tx_hash,
      method_name,
      gas_used,
      gas_price,
      total_cost,
      user_address,
      block_number,
      created_at,
      status = 'success'
    } = data;
    
    // 检查必要参数
    if (!tx_hash || !method_name || !gas_used || !gas_price || !user_address || !block_number) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { 
        status: 400 
      });
    }

    // 插入数据到gas_records表
    const query = `
      INSERT INTO gas_records (
        tx_hash,
        method_name,
        gas_used,
        gas_price,
        total_cost,
        user_address,
        block_number,
        created_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      tx_hash,
      method_name,
      gas_used,
      gas_price,
      total_cost,
      user_address,
      block_number,
      created_at,
      status
    ]);

    return NextResponse.json({ 
      success: true,
      message: 'Gas记录保存成功'
    });
  } catch (error) {
    console.error('保存Gas记录失败:', error);
    return NextResponse.json({ 
      success: false,
      error: '保存Gas记录失败' 
    }, { 
      status: 500 
    });
  }
}

// 获取gas记录列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const method_name = searchParams.get('method_name');
    const user_address = searchParams.get('user_address');

    let query = 'SELECT * FROM gas_records';
    const params = [];
    const conditions = [];

    if (method_name) {
      conditions.push('method_name = ?');
      params.push(method_name);
    }

    if (user_address) {
      conditions.push('user_address = ?');
      params.push(user_address);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);

    return NextResponse.json({
      success: true,
      records: rows
    });
  } catch (error) {
    console.error('获取Gas记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取Gas记录失败'
    }, { 
      status: 500 
    });
  }
} 