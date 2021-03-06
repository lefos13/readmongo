module.exports = {
  apps: [
    {
      name: "readmongo",
      autorestart: true,
      watch: true,
      //"script"      : "/home/node/swarmlab-app/run/app.js",
      cwd: "/usr/src/app/swarmlab-app/src",
      script: "run/app.js",
      run_as_user: "node",
      args: "start",
      //"node_args"        : "--harmony",
      //"node_args"   : "['--trace-deprecation']",
      pid_file: "/home/node/run/pid.pid",
      log_type: "json",
      log_file: "/home/node/logs/logfile",
      error_file: "/home/node/logs/errorfile",
      out_file: "/home/node/logs/outfile",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      merge_logs: true,
      exec_mode: "fork",
      max_restarts: 10,
      max_memory_restart: "500M",
      restart_delay: 1000,
    },
  ],
};
