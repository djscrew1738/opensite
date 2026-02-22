process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || (await import('crypto')).randomBytes(32).toString('base64');
process.env.NODE_ENV = 'development';

console.log('Starting backend import test from:', process.cwd());

async function testImports() {
  const modules = [
    ['./backend/src/services/logger.js', 'logger'],
    ['./backend/src/services/database.js', 'database'],
    ['./backend/src/services/cache.js', 'cache'],
  ];

  for (const [path, name] of modules) {
    try {
      await import(path);
      console.log(`✓ ${name} imported`);
    } catch (err) {
      console.error(`✗ ${name} failed: ${err.message}`);
      return;
    }
  }
  
  console.log('Core services loaded, now testing routes...');
  
  const routes = [
    ['./backend/src/routes/health.js', 'healthRoutes'],
    ['./backend/src/routes/ai.js', 'aiRoutes'],
    ['./backend/src/routes/leads.js', 'leadsRoutes'],
    ['./backend/src/routes/estimates.js', 'estimatesRoutes'],
    ['./backend/src/routes/upload.js', 'uploadRoutes'],
    ['./backend/src/routes/canvas.js', 'canvasRoutes'],
  ];
  
  for (const [path, name] of routes) {
    try {
      await import(path);
      console.log(`✓ ${name} imported`);
    } catch (err) {
      console.error(`✗ ${name} failed: ${err.message}`);
      console.error(err.stack);
      return;
    }
  }
  
  console.log('All imports successful!');
}

testImports();
