const path = require('path');

let dbImpl = null;

try {
  const Database = require('better-sqlite3');
  const dbPath = process.env.CRM_DB || path.join(__dirname, '..', 'crm.sqlite');
  const db = new Database(dbPath);
  function init() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT, data TEXT);
      CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY, companyId TEXT, name TEXT);
      CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, companyId TEXT, customer TEXT, status TEXT, createdAt INTEGER, data TEXT);
      CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY, leadId TEXT, ownerId TEXT, customer TEXT, value REAL, createdAt INTEGER, data TEXT);
      CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, status TEXT, ownerId TEXT, createdAt INTEGER);
      CREATE TABLE IF NOT EXISTS targets (id TEXT PRIMARY KEY, companyId TEXT, branchId TEXT, metric TEXT, value REAL, ownerId TEXT);
    `);
  }
  function run(stmt, params) { return db.prepare(stmt).run(params); }
  function get(stmt, params) { return db.prepare(stmt).get(params); }
  function all(stmt, params) { return db.prepare(stmt).all(params); }
  dbImpl = { init, run, get, all };
  console.log('DB: using better-sqlite3 at', dbPath);
} catch (err) {
  console.warn('DB: better-sqlite3 not available, falling back to in-memory store. Error:', err && err.message);
  // In-memory fallback implementation for the queries used by server.js
  const memory = {
    companies: {},
    branches: {},
    leads: {},
    sales: {},
    tasks: {},
    targets: {}
  };

  function init() { /* no-op for memory */ }

  function run(stmt, params) {
    const s = stmt.trim();
    // INSERT INTO companies
    if (/^INSERT INTO companies/i.test(s)) {
      memory.companies[params.id] = { id: params.id, name: params.name, data: JSON.parse(params.data) };
      return { changes: 1 };
    }
    if (/^INSERT INTO branches/i.test(s)) {
      memory.branches[params.id] = { id: params.id, companyId: params.companyId, name: params.name };
      return { changes: 1 };
    }
    if (/^INSERT INTO leads/i.test(s)) {
      memory.leads[params.id] = { id: params.id, companyId: params.companyId, customer: params.customer, status: params.status, createdAt: params.createdAt, data: params.data };
      return { changes: 1 };
    }
    if (/^INSERT INTO sales/i.test(s)) {
      memory.sales[params.id] = { id: params.id, leadId: params.leadId, ownerId: params.ownerId, customer: params.customer, value: params.value, createdAt: params.createdAt, data: params.data };
      return { changes: 1 };
    }
    if (/^UPDATE leads SET status=/i.test(s)) {
      const id = params.id;
      if (memory.leads[id]) { memory.leads[id].status = params.status; return { changes:1 }; }
      return { changes:0 };
    }
    if (/^INSERT INTO tasks/i.test(s)) {
      memory.tasks[params.id] = { id: params.id, title: params.title, status: params.status, ownerId: params.ownerId, createdAt: params.createdAt };
      return { changes: 1 };
    }
    if (/^INSERT INTO targets/i.test(s)) {
      memory.targets[params.id] = { id: params.id, companyId: params.companyId, branchId: params.branchId, metric: params.metric, value: params.value, ownerId: params.ownerId };
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  function get(stmt, params) {
    const s = stmt.trim();
    if (/SELECT \* FROM leads WHERE id=/i.test(s)) {
      return memory.leads[params.id] || null;
    }
    if (/SELECT \* FROM companies WHERE id=/i.test(s)) {
      return memory.companies[params.id] ? { id: memory.companies[params.id].id, name: memory.companies[params.id].name, data: JSON.stringify(memory.companies[params.id]) } : null;
    }
    return null;
  }

  function all(stmt, params) {
    const s = stmt.trim();
    if (/SELECT data FROM companies/i.test(s)) {
      return Object.values(memory.companies).map(c => ({ data: JSON.stringify(c) }));
    }
    if (/SELECT \* FROM sales WHERE ownerId=/i.test(s)) {
      return Object.values(memory.sales).filter(sale => sale.ownerId === params.ownerId).map(sale => ({ ...sale }));
    }
    if (/SELECT \* FROM targets WHERE ownerId=/i.test(s)) {
      return Object.values(memory.targets).filter(t => t.ownerId === params.ownerId).map(t => ({ ...t }));
    }
    if (/SELECT \* FROM leads/i.test(s)) {
      return Object.values(memory.leads).map(lead => ({ ...lead }));
    }
    if (/SELECT \* FROM sales/i.test(s)) {
      return Object.values(memory.sales).map(s => ({ ...s }));
    }
    if (/SELECT \* FROM tasks/i.test(s)) {
      return Object.values(memory.tasks).map(task => ({ ...task }));
    }
    if (/SELECT \* FROM targets/i.test(s)) {
      return Object.values(memory.targets).map(target => ({ ...target }));
    }
    if (/SELECT COUNT\(\*\) as c FROM leads/i.test(s)) {
      return [{ c: Object.keys(memory.leads).length }];
    }
    return [];
  }

  dbImpl = { init, run, get, all };
}

module.exports = dbImpl;
