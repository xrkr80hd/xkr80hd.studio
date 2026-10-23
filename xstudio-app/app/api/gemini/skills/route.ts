import { NextRequest, NextResponse } from 'next/server';
import { XCE_GEMINI_DECLARATIONS, executeGeminiTool, parseXceCommand } from '../../../../lib/gemini/skills-connector';
import { isTrustedOrigin } from '../../../../lib/xstudio-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const command = url.searchParams.get('cmd');

  if (command) {
    const parsed = parseXceCommand(command);
    return NextResponse.json({
      query: command,
      parsed,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  }

  return NextResponse.json({
    connector: 'XCE Gemini Skills Connector',
    version: '2.0.0',
    source_url: 'https://xstudio.xrkr80hd.studio',
    declarations_count: XCE_GEMINI_DECLARATIONS.length,
    tools: XCE_GEMINI_DECLARATIONS,
    gemini_sdk_config: {
      tools: [
        {
          functionDeclarations: XCE_GEMINI_DECLARATIONS
        }
      ]
    }
  }, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    }
  });
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { tool, arguments: args } = body;

    if (!tool) {
      return NextResponse.json({ error: 'Tool name required' }, { status: 400 });
    }

    const result = await executeGeminiTool(tool, args || {});
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid tool invocation' }, { status: 500 });
  }
}
