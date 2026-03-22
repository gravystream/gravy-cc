module.exports = {
  apps: [{
    name: "novaclio",
    script: "node_modules/.bin/next",
    args: "start -p 3001",
    cwd: "/var/www/gravy-cc-deploy",
    exec_mode: "fork",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: "3001",
      DATABASE_URL: "postgresql://gravy_user:Nv025d1ae150604dcc056979cdXk@127.0.0.1:5432/gravy_cc"
    }
  }]
};
