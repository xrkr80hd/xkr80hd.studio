import { NextResponse } from 'next/server';
import { XCE_GEMINI_DECLARATIONS } from '../../../../../lib/gemini/skills-connector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'XCE Cinematic Studio — Gemini Skills Connector',
      version: '2.0.0',
      description: 'Official production API connector for XCE cinematic studio plugins (UNIFY, FIRESTARTER, SCRIPT, ENGINE, COMPOSER, MV, CGE, COMMERCIAL_STORYBOARD) powering Gemini and AI Studio.',
    },
    servers: [
      {
        url: 'https://xstudio.xrkr80hd.studio',
        description: 'Production XSTUDIO Node'
      }
    ],
    paths: {
      '/api/gemini/skills': {
        get: {
          summary: 'Inspect registered skills and route shorthand commands',
          description: 'Dispatches XCE shorthand commands (SS, STF, US, SL, FF, 123GO, CMPN) or returns function declarations.',
          parameters: [
            {
              name: 'cmd',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Universal XCE shorthand command (e.g. SS, SL, 123GO, FF, CGE)'
            }
          ],
          responses: {
            '200': {
              description: 'Command evaluation or tools schema',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Execute an XCE Cinematic Studio tool directly',
          description: 'Executes one of the 8 XCE plugins with validated arguments.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tool', 'arguments'],
                  properties: {
                    tool: {
                      type: 'string',
                      description: 'Name of the function declaration (e.g. xce_firestarter_session, xce_engine_cref, xce_mv_director)'
                    },
                    arguments: {
                      type: 'object',
                      description: 'JSON arguments matching the tool schema'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful tool execution result'
            }
          }
        }
      }
    },
    components: {
      schemas: Object.fromEntries(
        XCE_GEMINI_DECLARATIONS.map(decl => [
          decl.name,
          {
            type: 'object',
            description: decl.description,
            properties: decl.parameters.properties,
            required: decl.parameters.required
          }
        ])
      )
    }
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=600'
    }
  });
}
