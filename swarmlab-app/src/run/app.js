"use strict";

var pathmodule = require("path");
var app = require("express")();
var http = require("http").Server(app);
var https = require("https");
var CONFIG = require(pathmodule.resolve(__dirname, "runconfig.js"));
const io = require("socket.io")(http, {
  //  pingTimeout: 30000,
  //  allowUpgrades: false,
  //  serveClient: false,
  //  pingInterval: 10000,
  //  //transports: [ 'websocket', 'polling' ],
  //  transports: [ 'polling', 'websocket' ],
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
  cookie: {
    name: "test",
    httpOnly: false,
    path: "/custom",
  },
});

const createAdapter = require("socket.io-redis");

const Redis = require("ioredis");

const pubClient = new Redis({
  host: "redisserver",
  port: 6379,
});

//const pubClient = new RedisClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter({ pubClient, subClient }));

pubClient.on("connect", function () {
  console.log("You are now connected");
});

const MongoClient = require("mongodb").MongoClient;
const { DateTime } = require("luxon");

var async = require("async");
const { check, validationResult } = require("express-validator");
const urlExistSync = require("url-exist-sync");

var express = require("express");
app.use(express.json());

const axios = require("axios");
axios.defaults.timeout = 30000;

const helmet = require("helmet");
app.use(helmet());

const cors = require("cors");
const { MongoError } = require("mongodb");
const whitelist = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:3080",
  "http://localhost:3081",
  "http://localhost:3082",
];
const corsOptions = {
  credentials: true,
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "device-remember-token",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Origin",
    "Accept",
  ],
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
      //callback(new Error('Not allowed by CORS'))
    }
  },
};

// ------------------------------
// --- LEFOS MONGO LOGGING
// ------------------------------
// Lefos - get length of logs
app.get("/length", cors(corsOptions), (req, res) => {
  console.error("getting length of logs");
  var url = "mongodb://mongo:27017/";
  MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) throw err;
      var dbo = db.db("fluentdb");
      dbo
        .collection("test")
        .find({})
        .toArray(function (err, result) {
          if (err) throw err;
          // EPIDI EXW NESTED JSON PREPEI NA TO KANW PARSE DUO FORES
          var obj = JSON.parse(JSON.stringify(result));
          let containers = [];
          var type;
          var found = 0;
          obj.forEach((value) => {
            //new code
            if (containers.length == 0) {
              type = checkService();
              if (type == "out") {
                containers.push({
                  name: value.container_name,
                  lengtho: 1,
                  lengthe: 0,
                });
              } else if (type == "err") {
                containers.push({
                  name: value.container_name,
                  lengtho: 0,
                  lengthe: 1,
                });
              }
            } else {
              containers.forEach((val) => {
                if (val.name == value.container_name) {
                  found = 1;
                  type = checkService();
                  if (type == "out") {
                    val.lengtho++;
                  } else if (type == "err") {
                    val.lengthe++;
                  }
                }
              });
              if (found == 0) {
                type = checkService();
                if (type == "out") {
                  containers.push({
                    name: value.container_name,
                    lengtho: 1,
                    lengthe: 0,
                  });
                } else if ("error") {
                  containers.push({
                    name: value.container_name,
                    lengtho: 0,
                    lengthe: 1,
                  });
                }
              }
              found = 0;
            }

            // new code end

            function checkService() {
              if (value.tag.includes("mongodb")) {
                var tmp = JSON.parse(value.log);
                if (tmp.s == "I") return "out";
                // count every informative log as an output log
                else if (tmp.s == "W" || tmp.s == "E") return "err"; //count every warning and error log
              } else if (value.tag.includes("node")) {
                if (IsJsonString(value.log)) var test = JSON.parse(value.log);
                else {
                  if (value.source == "stdout") return "out";
                  else return "err";
                }

                var type = test.type;
                if (type == "out") return "out";
                else return "err";
              } else if (value.tag.includes("redis")) {
                return "out";
              }
            }
          });
          var RES = new Object();
          RES.data = containers;

          // console.log("Sending Data: " + jsonfinal);
          res.json(containers);
          db.close();
        });
    }
  );
});

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

app.get("/services", cors(corsOptions), (req, res) => {
  console.error("getting length of logs");

  var url = "mongodb://mongo:27017/";

  MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) throw err;
      var dbo = db.db("fluentdb");
      dbo
        .collection("test")
        .find({})
        .toArray(function (err, result) {
          if (err) throw err;
          // EPIDI EXW NESTED JSON PREPEI NA TO KANW PARSE DUO FORES
          var obj = JSON.parse(JSON.stringify(result));
          var services = [];
          var flag = false;
          obj.forEach((value) => {
            if (flag == false) {
              services.push(value.container_name);
              flag = true;
            } else {
              var tmp = "none";
              var count = 0;
              services.forEach((val) => {
                var length = services.length;

                var found = false;
                if (
                  val != value.container_name &&
                  count + 1 < length &&
                  found == false
                ) {
                  count++;
                  //services.push(value.container_name)
                } else if (
                  val != value.container_name &&
                  count + 1 == length &&
                  found == false
                ) {
                  //found =true;
                  tmp = value.container_name;
                } else if (val == value.container_name) {
                  found = true;
                }
              });

              if (tmp != "none") {
                services.push(tmp);
              }
            }
          });
          var RES = new Object();

          RES.data = services;
          // console.log("Sending Data: " + jsonfinal);
          res.json(RES.data);
          db.close();
        });
    }
  );
});

// Lefos - mongo test read
app.get("/test", cors(corsOptions), (req, res) => {
  console.log("reading from db....");

  var url = "mongodb://mongo:27017/";

  MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) throw err;
      var dbo = db.db("fluentdb");
      dbo
        .collection("test")
        .find({})
        .toArray(function (err, result) {
          if (err) throw err;
          // EPIDI EXW NESTED JSON PREPEI NA TO KANW PARSE DUO FORES
          var obj = JSON.parse(JSON.stringify(result));
          var jsonfinal = [];
          var mongo = [];
          var app = [];
          obj.forEach((value) => {
            if (value.container_name == "/redisserver") {
              // jsonfinal.push(JSON.parse(value.log));
              jsonfinal.push(value);
            } else if (value.container_name == "/mongo") {
              mongo.push(JSON.parse(value.log));
            } else if (value.log.includes("app_name")) {
              app.push(JSON.parse(value.log));
            }
          });
          var RES = new Object();
          RES.data = {
            redis: jsonfinal,
            mongo: mongo,
            app: app,
          };
          res.json(RES.data);
          db.close();
        });
    }
  );
});

app.get("/raw", cors(corsOptions), (req, res) => {
  console.log("reading from db....");

  var url = "mongodb://mongo:27017/";

  MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) throw err;
      var dbo = db.db("fluentdb");
      dbo
        .collection("test")
        .find({})
        .toArray(function (err, result) {
          if (err) throw err;
          // EPIDI EXW NESTED JSON PREPEI NA TO KANW PARSE DUO FORES
          var obj = JSON.parse(JSON.stringify(result));
          var jsonfinal = [];
          obj.forEach((value) => {
            jsonfinal.push(value);
          });
          var RES = new Object();
          RES.data = {
            all: jsonfinal,
          };
          res.json(RES.data);
          db.close();
        });
    }
  );
});

app.get("/test2", cors(corsOptions), (req, res) => {
  var RES = new Object();
  const page = req.query["page"];
  const per_page = req.query["per_page"];
  var sort = req.query["sort"];
  var filter = req.query["filter"];
  var type = req.query["type"];
  var sorttmp1 = sort.split("|");
  var sortname = sorttmp1[0];
  var sortorder = sorttmp1[1];

  // text to search in logs
  var logtext = req.query["logtext"];
  // service to choose from all containers
  var selected = req.query["selected"];

  console.error("EXTRA PARAMS: " + logtext);
  //console.log("TEST LOG");

  var url = "mongodb://mongo:27017/";
  var jsonfinal = [];
  MongoClient.connect(
    url,
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) throw err;
      var dbo = db.db("fluentdb");
      dbo
        .collection("test")
        .find({})
        .toArray(function (err, result) {
          if (err) throw err;
          // EPIDI EXW NESTED JSON PREPEI NA TO KANW PARSE DUO FORES
          var obj = JSON.parse(JSON.stringify(result));

          obj.forEach((value) => {
            var test = IsJsonString(value.log);
            if (value.tag.includes("node") && IsJsonString(value.log)) {
              var tmp = JSON.parse(value.log);
              var container_name = value.container_name;
              var tmptype;
              tmp.app_name = container_name;
              if (tmp.type == "out") {
                tmptype = '<div class="outtype" >' + tmp.type + "</div>";
              } else if (tmp.type == "err") {
                tmptype = '<div class="errtype" >' + tmp.type + "</div>";
              }
              var tmp2 = {
                message: tmp.message,
                timestamp: value.time,
                type: tmptype,
                process_id: "-",
                app_name: value.container_name,
              };
              // filtrarisma gia to text poy exei dwsei o xrhsths
              if (
                logtext != "" &&
                tmp.message.includes(logtext) &&
                (container_name == selected || selected == "All")
              ) {
                jsonfinal.push(tmp2);
              } else if (logtext != "" && !tmp.message.includes(logtext)) {
              } else if (
                logtext == "" &&
                (container_name == selected || selected == "All")
              ) {
                jsonfinal.push(tmp2);
              }
            } else if (value.tag.includes("node") && test == false) {
              //console.error("EDW EIMAI!!!!");
              var tmptype;
              if (value.source == "stdout") {
                tmptype = '<div class="outtype" >' + "out" + "</div>";
              } else if (value.source == "stderr") {
                tmptype = '<div class="errtype" >' + "err" + "</div>";
              }
              var tmp2 = {
                message: value.log,
                timestamp: value.time,
                type: tmptype,
                process_id: "-",
                app_name: value.container_name,
              };
              if (
                logtext != "" &&
                tmp2.message.includes(logtext) &&
                (value.container_name == selected || selected == "All")
              ) {
                jsonfinal.push(tmp2);
              } else if (logtext != "" && !value.log.includes(logtext)) {
                //console.error("lathos sinthiki");
              } else if (
                logtext == "" &&
                (value.container_name == selected || selected == "All")
              ) {
                jsonfinal.push(tmp2);
              }
            } else if (
              value.tag.includes("redis") &&
              (value.container_name == selected || selected == "All")
            ) {
              var tmplog = value;
              //timestamp
              var time = tmplog.time;
              var tmp = {
                message: tmplog.log,
                timestamp: time,
                type: "<div class= 'outtype'>out</div>",
                process_id: "-",
                app_name: value.container_name,
              };
              if (logtext == "" || tmp.message.includes(logtext))
                jsonfinal.push(tmp);
            } else if (
              value.tag.includes("mongodb") &&
              (value.container_name == selected || selected == "All")
            ) {
              var tmplog = JSON.parse(value.log);
              var msg2 = tmplog.msg;

              //timestam
              var time = value.time;
              var tmp = {
                message: msg2,
                timestamp: time,
                type: "<div class= 'outtype'>out</div>",
                process_id: "-",
                app_name: value.container_name,
              };
              if (logtext == "" || tmp.message.includes(logtext))
                jsonfinal.push(tmp);
            } else {
              var tmp = {
                message: value.log,
                timestamp: value.time,
                type: "<div class= 'outtype'>" + value.source + "</div>",
                process_id: "-",
                app_name: value.container_name,
              };
            }
          });
          //console.log("Sending Data: " + jsonfinal);
          if (sortname == "type") {
            jsonfinal.sort(function (a, b) {
              if (sortorder == "asc") {
                return a.type.localeCompare(b.type);
              } else {
                return b.type.localeCompare(a.type);
              }
            });
          } else if (sortname == "message") {
            jsonfinal.sort(function (a, b) {
              if (sortorder == "asc") {
                return a.message.localeCompare(b.message);
              } else {
                return b.message.localeCompare(a.message);
              }
            });
          } else if (sortname == "time") {
            jsonfinal.sort(function (a, b) {
              if (sortorder == "asc") {
                return a.timestamp.localeCompare(b.timestamp);
              } else {
                return b.timestamp.localeCompare(a.timestamp);
              }
            });
          } else if (sortname == "app_name") {
            jsonfinal.sort(function (a, b) {
              if (sortorder == "asc") {
                return a.app_name.localeCompare(b.app_name);
              } else {
                return b.app_name.localeCompare(a.app_name);
              }
            });
          }
          //Pagination
          var total = jsonfinal.length;
          var perpage = per_page;
          var lastpage = total / perpage;
          if (lastpage <= 1) {
            lastpage = 1;
          } else {
            lastpage++;
          }
          lastpage = Math.trunc(lastpage);
          var next = page + 1;
          if (next >= lastpage) {
            next = lastpage;
          }
          var prev = page - 1;
          if (prev == 0) {
            prev = 1;
          }
          var from = (page - 1) * perpage + 1;
          var to = perpage * page;
          var mypage = new Object();
          var links = `
              {
                    "pagination": {
                            "total": ${total},
                            "per_page": ${perpage},
                            "current_page": ${page},
                            "last_page": ${lastpage},
                            "next_page_url": "?page=${next}",
                            "prev_page_url": "?page=${prev}",
                            "from": ${from},
                            "to": ${to},
                            "frommongo": ${from},
                            "tomongo": ${to}
                          }
                  }
                `;
          mypage.links = JSON.parse(links);
          from--;
          mypage.data = jsonfinal.slice(from, to);
          var RES = new Object();
          RES.code = req.query["action"];
          RES.token = req.query["token"];
          RES.error = false;
          RES.error_msg = "ok";
          RES.data = mypage;

          // console.log("Sending Data: " + jsonfinal);
          res.json(RES.data);
          db.close();
        });
    }
  );
});

console.log("reading from db....");

// Lefos-- variable poy krata to trexon room tou xrhsth kathe fora
var curRoom;

// var url = "mongodb://mongo:27017/";
// MongoClient.connect(url, function (err, db) {
//   if (err) throw err;
//   var dbo = db.db("fluentdb");
//   dbo.collection("test", onCollectionNew);
// });

async function onCollectionNew(err, collection) {
  /*
    Prepei na elegxw kathe fora an to socket id tou user einai energo
    wste na mhn diathreitai zwntanh h callback kai lamvanw dublicate
    data ston client
  */
  let options = {
    tailable: true,
    awaitdata: true,
    numberOfRetries: -1,
    tailableRetryInterval: 500,
  };
  var cursor = collection.find({}, options).stream();
  var itemsProcessed = 0;
  var room = this.user;
  var sid = this.id;
  console.log("Inside callback: " + room + " Id: " + sid);
  // LEFOS --- STORE USER IN REDIS
  var rep = setUser(sid, room);

  cursor.on("data", async function (data) {
    cursor.pause();
    var res = await getkey(sid);

    if (res == "1") {
      cursor.resume();
      var obj = JSON.parse(JSON.stringify(data));
      // var getres = getkey(sid);
      // if (getres == "1") {
      //   console.log("sending on event log");

      // } else if (getres == "2") {
      //   cursor.close();
      // }
      io.in(room).emit("logsend", obj);
    } else if (res == "2") {
      cursor.resume();
      console.log("Cursor is closing...");
      cursor.close();
    }
  });
}

io.on("connection", (s) => {
  console.error("socket connection");

  // -------- Lefos section
  //dbo.collection("test", onCollectionNew);

  // --------

  //s.set('transports', ['websocket']);
  //s.set('pingTimeout', 30000);
  //s.set('allowUpgrades', false);
  //s.set('serveClient', false);
  //s.set('pingInterval', 10000);
  // ------------------------------
  // --- set
  // ------------------------------
  var usersession = new Object();
  usersession.SOCKET = {};
  usersession.SOCKET.error = {};
  console.error("socket ...");
  s.auth = false;

  // ------------------------------
  // --- authenticate
  // ------------------------------
  s.on("authenticate", function (data) {
    const token = data;
    console.log("TEST LOG INSIDE ATHENTICATE SOCKET: " + token);
    (async () => {
      var isvalid = await checkToken(token);
      if (isvalid.action == "ok") {
        console.log("Authserver ok ", s.id + " - " + token);
        // pubClient.set(session, resob1string, function(err, res) {
        // });
        usersession.SOCKET.user = isvalid.user;
        usersession.SOCKET.scope = isvalid.scope; // space delimeter
        usersession.SOCKET.token = isvalid.token;
        usersession.SOCKET.id = s.id;

        //console.log("Reply: " + rep);
        // -----
        s.auth = true;
      } else {
        console.log("Authserver no ", s.id + " - " + token);
        s.auth = false;
      }
    })();
  });

  s.on("onevent", function (data) {
    //console.log("I GOT THE DATA: ", data);
    var binddata = {
      user: data,
      id: s.id,
    };
    checkstream(binddata);
  });

  s.on("disconnect", function () {
    //console.log("Socket: " + s.id + " Disconnected");
    console.log("Deleting " + s.id + "From redis");
    pubClient.del(s.id);
  });

  setTimeout(function () {
    if (!s.auth) {
      console.log("Disconnecting timeout socket ", s.id);
      //s.disconnect('unauthorized');
    } else {
      var room = usersession.SOCKET.user;
      //s.on("subscribe", function (room) {
      s.join(room);
      console.log("joining rooom", s.rooms);
      console.log(room + " created ");
      curRoom = room;
      // });
    }
  }, 30000);

  var id = s.id;
  s.on("log", (obj) => {
    console.error("from client " + s.id + " obj " + obj);
  });
});

// ***************************************************
//      checktoken
// ***************************************************

async function checkToken(token) {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  const instance = axios.create({
    baseURL: "https://api.swarmlab.io",
    withCredentials: true,
    rejectUnauthorized: false,
    crossdomain: true,
    httpsAgent: agent,
    headers: {
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer " + token,
    },
  });
  try {
    var pipelines = {
      source: "ssologin",
    };
    var params = {
      pipeline: pipelines,
    };

    var options = {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
    };

    instance.defaults.timeout = 30000;
    const res = await instance.post("/istokenvalidsso", params, options);
    if (res.status == 200) {
      //console.log("check " +JSON.stringify(res.data))
      return res.data;
    } else {
      console.log("noerror: " + res);

      return res.status;
    }
  } catch (err) {
    console.error("error: " + err);
    var error = new Object();
    error.action = "401";
    return error;
  }
}

function convertDateToUTC(date) {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  );
}

// ***************************************************
//      get pipelines
// ***************************************************

async function getpipelines(token, pipelinename) {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  const instance = axios.create({
    baseURL: "https://api.swarmlab.io",
    withCredentials: true,
    rejectUnauthorized: false,
    crossdomain: true,
    httpsAgent: agent,
    headers: {
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer " + token,
    },
  });
  /*
   var params = {
            playbook: value
          }
        var options = {
          params: params,
          headers: { 'content-type': 'application/x-www-form-urlencoded',Authorization: `Bearer ${token}` },
        };

        const playbook = await api.GET('playbookCode',options);
        return playbook
*/
  try {
    var pipelines = {
      querytokenFilter: CONFIG.api.token,
      filter: pipelinename,
    };
    //var params = {
    //    pipeline: pipelines
    //  }
    var params = {
      querytokenFilter: CONFIG.api.token,
      filter: pipelinename,
    };

    var options = {
      params: params,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
    };

    //https://api.swarmlab.io/gettutorlabrooms?sort=pipelinename%7Casc&page=1&per_page=5&filter=&type=scripts&tutor=yes
    instance.defaults.timeout = 30000;
    //const res = await instance.get('/getplaygrounds',params,options);
    const res = await instance.get("/getplaygrounds", options);
    if (res.status == 200) {
      return res.data;
    } else {
      console.log("noerror: " + res);
      return await res.status;
    }
  } catch (err) {
    console.error("error: " + err);
    var error = new Object();
    error.action = "401";
    return await error;
  }
}

// ***************************************************
//      get user pipelines
// ***************************************************

async function getuserpipelines(token, user, swarmlabname) {
  var pipelinename = user;
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  const instance = axios.create({
    baseURL: "https://api.swarmlab.io",
    withCredentials: true,
    rejectUnauthorized: false,
    crossdomain: true,
    httpsAgent: agent,
    headers: {
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer " + token,
    },
  });
  try {
    var pipelines = {
      querytokenFilter: CONFIG.api.token,
      filter: pipelinename,
      swarmlabname: swarmlabname,
    };
    //var params = {
    //    pipeline: pipelines
    //  }
    var params = {
      querytokenFilter: CONFIG.api.token,
      filter: pipelinename,
      swarmlabname: swarmlabname,
    };

    var options = {
      params: params,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
    };

    instance.defaults.timeout = 30000;
    const res = await instance.get("/getuserplaygrounds", options);
    if (res.status == 200) {
      return res.data;
    } else {
      console.log("noerror: " + res);
      return await res.status;
    }
  } catch (err) {
    console.error("error: " + err);
    var error = new Object();
    error.action = "401";
    error.error = err;
    return await error;
  }
}

global.online = "ob";
global.pipelines = [];

function sendlog(reslog, pathfileval) {
  var usertmp = global.pipelines.find((x) => x.pathlogfile == pathfileval);
  //for (var key in usertmp.data){
  var user = usertmp.data[0].user25user;
  // if(usertmp.data){
  console.log("-----------------------" + JSON.stringify(usertmp));
  io.in(user).emit("logdata", reslog);
  // }
  //}
}

function onlogfile(path) {
  console.log("File", path, "has been added");
  var pathfileval = pathmodule.basename(path);
  var arrfile = pathfileval.toString().split("-");
  var pathfile = arrfile[0];
  var indexfind1 = global.pipelines.findIndex(
    (x) => x.pathlogfile == pathfileval
  );
  console.log(
    "file11111111111111111111111111111111 " + JSON.stringify(pathfileval)
  );
  if (indexfind1 === -1) {
    (async () => {
      console.log(
        "file2222222222222222222222222222222222222 " +
          JSON.stringify(pathfileval)
      );
      var token = "d2539e5a7ae1f9f1b0eb2b8f22ca467a86d28407"; // desto
      var resdata = await getpipelines(token, pathfile);
      //resdata.data.pathlogfile = 'test'
      var resob = {};
      resob.pathlogfile = pathfileval;
      var resobarray = [];
      for (let i in resdata.data) {
        var resob1 = {};
        resob1.data = resdata.data[i].res25swarmlabname;
        resob1.user25user = resdata.data[i].res25user;
        resob1.res25creator = resdata.data[i].res25creator;
        resob1.res25fileforce = resdata.data[i].res25fileforce;
        resobarray.push(resob1);
      }
      resob.data = resobarray;
      var indexfind = global.pipelines.findIndex(
        (x) => x.pathlogfile == pathfileval
      );
      indexfind === -1
        ? global.pipelines.push(resob)
        : console.log("object already exists " + pathfileval);
    })();
  }
}

async function checkstream(data) {
  var res = await getkey(data.id);
  if (res == "1") {
    console.log("Stream is on!");
  } else {
    console.log("Creating Stream....");

    var url = "mongodb://mongo:27017/";
    MongoClient.connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      function (err, db) {
        if (err) throw err;
        var dbo = db.db("fluentdb");
        dbo.collection("test", onCollectionNew.bind(data));
      }
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSHA256ofJSON(data, inputEncoding, encoding) {
  if (!data) {
    return "";
  }
  inputEncoding = inputEncoding || "utf-8";
  encoding = encoding || "hex";
  const hash = require("crypto").createHash("md5");
  return hash.update(JSON.stringify(data), inputEncoding).digest(encoding);
}

// --- LEFOS - get user via token from REDIS
async function getUser(token) {
  return new Promise((resolve) => {
    pubClient.get(token, function (err, reply) {
      if (err) {
        console.log("----------error------------");

        resolve(null);
      } else {
        if (reply) {
          console.log("---------found----------");
          resolve(1);
        } else {
          console.log("----------not found------------");
          resolve(2);
          //return 2
        }
      }
    });
  });
}

//var getkey = function getkey(key) {
async function getkey(id) {
  return new Promise((resolve) => {
    pubClient.get(id, function (err, reply) {
      if (err) {
        console.log("----------error------------");

        resolve(null);
      } else {
        if (reply) {
          //console.log("---------fount----------");
          resolve(1);
        } else {
          console.log("----------not fount------------");
          resolve(2);
          //return 2
        }
      }
    });
  });
}
// Lefos === Set the user to redis
var setUser = function setus(id, user) {
  return new Promise((resolve) => {
    //pubClient.set(key,value, 'EX', expire, function(err,reply){
    pubClient.set(id, user, function (err, reply) {
      if (err) {
        resolve(null);
      } else {
        resolve(reply);
      }
    });
  });
};
// ===
var setkey = function setkv(key, value) {
  return new Promise((resolve) => {
    //pubClient.set(key,value, 'EX', expire, function(err,reply){
    pubClient.set(key, value, function (err, reply) {
      if (err) {
        resolve(null);
      } else {
        resolve(reply);
      }
    });
  });
};

async function iosend(data, issend, io, pubClient, user1) {
  var new1 = {};
  new1.tailed_path = data.tailed_path;
  new1.message = data.message;

  var now = new Date();
  var reslog1 = {};
  //reslog1.data = resob1
  reslog1.log = new1;
  reslog1.date = convertDateToUTC(now);
  var user = user1;

  const randomTimeInMs = Math.random() * 2000;
  await sleep(randomTimeInMs);
  var getres = await getkey(issend);

  if (getres == "1") {
    console.log(issend + " ---1 " + JSON.stringify(reslog1));
    //io.in(user).emit("logdata", reslog1);
  } else if (getres == "2") {
    console.log(issend + " ---2 " + JSON.stringify(reslog1));
    setkey(issend, "1");
    //pubClient.set(issend, '1', function(err, res) {
    //});
    io.in(user).emit("logdata", reslog1);
    //}
  }
}

function onCollection(err, collection) {
  let options = {
    tailable: true,
    awaitdata: true,
    numberOfRetries: -1,
    tailableRetryInterval: 500,
  };
  var cursor = collection.find({}, options).stream();
  var itemsProcessed = 0;

  var reslog = new Object();
  var now = new Date();
  cursor.on("data", function (data) {
    var issendob = new Object();
    issendob.id = data._id;
    issendob.message = data.message;
    issendob.tailed_path = data.tailed_path;

    var issend = getSHA256ofJSON(issendob);

    console.log("++++++++" + JSON.stringify(data));
    console.log("++++++++ob" + JSON.stringify(issendob));
    console.log("++++++++sha" + JSON.stringify(issend));

    var pathfileval = pathmodule.basename(data.tailed_path);
    var arrfile = pathfileval.toString().split("-");
    var pathfile = arrfile[0];

    var indexupdate = "yes";
    var resob = {};
    pubClient.get(pathfileval, function (err, object) {
      var objecttmp = JSON.parse(object);
      if (object) {
        var user1 = objecttmp.user25user.replace(/[\n\t\r]/g, "");
        iosend(data, issend, io, pubClient, user1);
      } else {
        (async () => {
          var token = "d2539e5a7ae1f9f1b0eb2b8f22ca467a86d28407"; // desto
          var resdata1 = await getpipelines(token, pathfile);
          resob.pathlogfile = pathfileval;
          var resob11 = {};
          var i1 = 0;
          resob11.data = resdata1.data[i1].res25swarmlabname;
          resob11.user25user = resdata1.data[i1].res25user.replace(
            /[\n\t\r]/g,
            ""
          );
          resob11.res25creator = resdata1.data[i1].res25creator;
          resob11.res25fileforce = resdata1.data[i1].res25fileforce;
          resob11.tailed_path = pathfileval;
          var resob1string1 = JSON.stringify(resob11);
          await pubClient.set(
            pathfileval,
            resob1string1,
            function (err, res) {}
          );
          var user1 = resob11.user25user;
          iosend(data, issend, io, pubClient, user1);
          console.log(" ---no--- " + JSON.stringify(data));
        })(); //await inside yes
      }
    });
  });

  setInterval(function () {
    console.log("itemsProcessed", itemsProcessed);
    // this method is also exposed by the Server instance
    //console.log(adapter.rooms);
  }, 8000);
}

http.listen(3000, () => console.error("listening on http://localhost:3000/"));
console.error("socket.io example");
