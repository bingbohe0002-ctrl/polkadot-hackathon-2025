import { NextResponse } from 'next/server';
import db from '../../../../utils/db';

// 保存NFT数据到数据库
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 解构需要的数据
    const { nft_id, token_uri, mint_item, owner, state, royaltyFeeNumerator } = data;
    
    // 插入数据到nfts表
    const query = `
      INSERT INTO nfts (
        nft_id, 
        token_uri, 
        mint_item, 
        owner, 
        state, 
        royalty_fee_numerator
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        token_uri = VALUES(token_uri),
        mint_item = VALUES(mint_item),
        owner = VALUES(owner),
        state = VALUES(state),
        royalty_fee_numerator = VALUES(royalty_fee_numerator)
    `;

    await db.query(query, [
      nft_id,
      token_uri,
      mint_item,
      owner,
      state,
      royaltyFeeNumerator
    ]);

    return NextResponse.json({ 
      success: true,
      message: '数藏数据保存成功'
    });
  } catch (error) {
    console.error('保存数藏数据失败:', error);
    return NextResponse.json({ 
      success: false,
      error: '保存数藏数据失败' 
    }, { 
      status: 500 
    });
  }
} 