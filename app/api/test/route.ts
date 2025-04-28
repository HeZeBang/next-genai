// app/api/formparser/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'querystring';

export async function POST(req: NextRequest) {
    try {
        // 获取请求体
        const body = await req.text();  // 获取 raw text 请求体

        // 使用 querystring 解析表单数据
        const parsedBody = parse(body);

        // 返回 JSON 响应
        return NextResponse.json({
            message: 'Request successfully processed',
            data: parsedBody,
        });
    } catch (error) {
        // 如果解析或处理发生错误，返回 500 错误
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
