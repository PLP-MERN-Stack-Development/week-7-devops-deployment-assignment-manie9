const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function checkHealth() {
  const results = {
    timestamp: new Date().toISOString(),
    backend: { status: 'unknown', responseTime: 0 },
    frontend: { status: 'unknown', responseTime: 0 }
  };

  // Check backend health
  try {
    const start = Date.now();
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    results.backend.responseTime = Date.now() - start;
    results.backend.status = response.status === 200 ? 'healthy' : 'unhealthy';
    results.backend.data = response.data;
  } catch (error) {
    results.backend.status = 'unhealthy';
    results.backend.error = error.message;
  }

  // Check frontend availability
  try {
    const start = Date.now();
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    results.frontend.responseTime = Date.now() - start;
    results.frontend.status = response.status === 200 ? 'healthy' : 'unhealthy';
  } catch (error) {
    results.frontend.status = 'unhealthy';
    results.frontend.error = error.message;
  }

  return results;
}

// Run health check
checkHealth()
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
    
    // Exit with error code if any service is unhealthy
    const isHealthy = results.backend.status === 'healthy' && 
                     results.frontend.status === 'healthy';
    process.exit(isHealthy ? 0 : 1);
  })
  .catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });