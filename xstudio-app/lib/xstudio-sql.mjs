import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool && process.env.SQL_HOST && process.env.SQL_DB_NAME) {
    pool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });
    pool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return pool;
}

export function isCloudSqlAvailable() {
  return Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME);
}

export async function sqlQuery(text, params = []) {
  const p = getPool();
  if (!p) throw new Error('Cloud SQL is not configured');
  return p.query(text, params);
}

// Project & Manifest Operations for XSTUDIO Engine
export async function dbLoadProject(owner, project) {
  const res = await sqlQuery(
    'SELECT manifest, revision FROM xce_projects WHERE owner = $1 AND project = $2',
    [owner, project]
  );
  return res.rows[0] || null;
}

export async function dbSaveProject(owner, project, revision, manifest) {
  const manifestStr = typeof manifest === 'string' ? manifest : JSON.stringify(manifest);
  if (revision === 0) {
    // Insert new project or handle conflict
    const res = await sqlQuery(
      `INSERT INTO xce_projects (owner, project, revision, manifest, created_at, updated_at)
       VALUES ($1, $2, 1, $3, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING
       RETURNING revision`,
      [owner, project, manifestStr]
    );
    return { changes: res.rowCount || 1, revision: 1 };
  } else {
    const res = await sqlQuery(
      `UPDATE xce_projects
       SET manifest = $1, revision = revision + 1, updated_at = NOW()
       WHERE owner = $2 AND project = $3 AND revision = $4
       RETURNING revision`,
      [manifestStr, owner, project, revision]
    );
    return { changes: res.rowCount, revision: res.rows[0]?.revision || revision + 1 };
  }
}

export async function dbListProjects(owner) {
  const res = await sqlQuery(
    'SELECT project, revision, manifest FROM xce_projects WHERE owner = $1 ORDER BY updated_at DESC',
    [owner]
  );
  return res.rows.map(row => ({
    project: row.project,
    revision: row.revision,
    manifest: row.manifest,
  }));
}

export async function dbGetContext(owner) {
  const res = await sqlQuery(
    'SELECT project, project_order FROM xce_active_context WHERE owner = $1',
    [owner]
  );
  return res.rows[0] || { project: 'default', project_order: [] };
}

export async function dbSaveContext(owner, project, projectOrder = null) {
  if (projectOrder !== null) {
    const res = await sqlQuery(
      `INSERT INTO xce_active_context (owner, project, project_order, updated_at)
       VALUES ($1, COALESCE($2, 'default'), $3, NOW())
       ON CONFLICT (owner) DO UPDATE
       SET project_order = EXCLUDED.project_order, updated_at = NOW()`,
      [owner, project, JSON.stringify(projectOrder)]
    );
    return { changes: res.rowCount };
  }
  const res = await sqlQuery(
    `INSERT INTO xce_active_context (owner, project, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (owner) DO UPDATE
     SET project = EXCLUDED.project, updated_at = NOW()`,
    [owner, project]
  );
  return { changes: res.rowCount };
}

export async function dbGetCode(owner, project) {
  const res = await sqlQuery(
    'SELECT code FROM xce_project_codes WHERE owner = $1 AND project = $2',
    [owner, project]
  );
  return res.rows[0] || null;
}

export async function dbReserveCode(code, owner, project) {
  const res = await sqlQuery(
    `INSERT INTO xce_project_codes (code, owner, project, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (code) DO NOTHING`,
    [code, owner, project]
  );
  return { changes: res.rowCount };
}

// File Storage in Cloud SQL (xstudio_asset_files)
export async function dbPutFile(key, data, mimeType = 'application/octet-stream') {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await sqlQuery(
    `INSERT INTO xstudio_asset_files (key, mime_type, size, data, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (key) DO UPDATE
     SET mime_type = EXCLUDED.mime_type, size = EXCLUDED.size, data = EXCLUDED.data, created_at = NOW()`,
    [key, mimeType, buffer.length, buffer]
  );
  return { key, size: buffer.length };
}

export async function dbGetFile(key) {
  const res = await sqlQuery(
    'SELECT mime_type, size, data FROM xstudio_asset_files WHERE key = $1',
    [key]
  );
  if (!res.rows[0]) return null;
  const row = res.rows[0];
  const buf = row.data;
  return {
    body: buf,
    size: Number(row.size),
    mime_type: row.mime_type,
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    httpMetadata: { contentType: row.mime_type },
  };
}

export async function dbHeadFile(key) {
  const res = await sqlQuery(
    'SELECT mime_type, size FROM xstudio_asset_files WHERE key = $1',
    [key]
  );
  if (!res.rows[0]) return null;
  return {
    file: {
      size: Number(res.rows[0].size),
      mime_type: res.rows[0].mime_type,
    },
  };
}

// Asset Registry in Cloud SQL (xstudio_assets)
export const assetColumns = 'id,project_id,kind,name,mime_type,byte_size,storage_path,source_provider,status,workflow_status,created_at';

export async function dbListAssets(ownerId, offset = 0, limit = 100) {
  const res = await sqlQuery(
    `SELECT ${assetColumns} FROM xstudio_assets
     WHERE owner_id = $1
     ORDER BY created_at DESC, id DESC
     OFFSET $2 LIMIT $3`,
    [ownerId, offset, limit + 1]
  );
  const rows = res.rows;
  return {
    assets: rows.slice(0, limit),
    next_offset: rows.length > limit ? offset + limit : null,
  };
}

export async function dbInsertAsset(ownerId, assetData, fileBytes = null) {
  const path = assetData.storage_path || `${ownerId}/${crypto.randomUUID()}`;
  if (fileBytes) {
    await dbPutFile(path, fileBytes, assetData.mime_type);
  }
  const res = await sqlQuery(
    `INSERT INTO xstudio_assets
     (owner_id, project_id, kind, name, mime_type, byte_size, storage_path, source_provider, status, workflow_status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     RETURNING ${assetColumns}`,
    [
      ownerId,
      assetData.project_id || null,
      assetData.kind,
      assetData.name,
      assetData.mime_type,
      assetData.byte_size,
      path,
      assetData.source_provider || 'manual',
      assetData.status || 'ready',
      assetData.workflow_status || 'draft',
    ]
  );
  return res.rows[0];
}

export async function dbUpdateAssetWorkflow(ownerId, id, workflowStatus) {
  const res = await sqlQuery(
    `UPDATE xstudio_assets
     SET workflow_status = $1
     WHERE id = $2 AND owner_id = $3
     RETURNING ${assetColumns}`,
    [workflowStatus, id, ownerId]
  );
  return res.rows[0] || null;
}

export async function dbGetAsset(ownerId, id) {
  const res = await sqlQuery(
    `SELECT ${assetColumns} FROM xstudio_assets WHERE id = $1 AND owner_id = $2`,
    [id, ownerId]
  );
  return res.rows[0] || null;
}
