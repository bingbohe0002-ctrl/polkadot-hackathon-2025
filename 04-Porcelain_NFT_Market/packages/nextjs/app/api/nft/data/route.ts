import db from '../../../../utils/db';

// http://localhost:3000/api/nft/data

// 处理 GET 请求
export async function GET() {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        return Response.json({ message: '✅ Database connected!', data: rows });
    } catch (error) {
      return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
  }
  
  // 处理 POST 请求
  // export async function POST(request: Request) {
  //   try {
  //     const data = await request.json();
  //     return Response.json({ message: 'Data received', data });
  //   } catch (error) {
  //     return Response.json({ error: 'Failed to process data' }, { status: 400 });
  //   }
  // }

  export async function POST(req: Request) {
    const { data } = await req.json();
    if (!data) {
      return Response.json({ error: 'NFT ID and data are required' }, { status: 400 });
    }
  
    try {
      const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
      const values = Object.values(data);
  
      await db.query(
        `INSERT INTO nft_data (${Object.keys(data).join(", ")}) 
         VALUES (${values.map(() => '?').join(", ")})
         ON DUPLICATE KEY UPDATE ${fields}`, 
        [...values, ...values]
      );
  
      return Response.json({ message: 'NFT data updated successfully' });
    } catch (error) {
      console.error('Database update error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    } 
  }
  