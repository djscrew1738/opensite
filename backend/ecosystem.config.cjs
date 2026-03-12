module.exports = {
  apps: [
    {
      name: 'opensite-backend',
      script: 'src/server.js',
      cwd: '/home/djscrew/projects/web/opensite/backend',

      // Give the old process time to release port 5001 before restarting
      kill_timeout: 5000,
      restart_delay: 3000,

      // Stability thresholds — prevent runaway restart loops
      max_restarts: 15,
      min_uptime: 5000,

      // Exponential backoff on repeated crashes
      exp_backoff_restart_delay: 100,

      // No env override — server.js loads .env via dotenv itself
    },
  ],
};
