import app from "./app";
// import * as open from "open";
import config from "./config";
import * as dayjs from "dayjs";
import * as multer from "multer";
import { homework, user, submission } from "./models/mysql";
import Logger from "./loaders/logger";
import { queryTable } from "./utils/mysql";
const expressSwagger = require("express-swagger-generator")(app);
const cors = require("cors");
app.use(cors());
expressSwagger(config.options);

queryTable(user);
queryTable(homework);
queryTable(submission);

import {
  login,
  register,
  updateList,
  deleteList,
  searchPage,
  searchVague,
  upload,
  uploadHomeworkContent,
  captcha,
  asyncRoutes,
  publishHomework,
  deletePublishedHomework,
  updatePublishedHomework,
  getHomeworks,
  getHomeworkImages,
  getHomeworkStates,
  submitHomework,
  deleteSubmitedHomework,
  getProfile,
  updateProfile,
} from "./router/http";

app.post("/login", (req, res) => {
  login(req, res);
});

app.post("/register", (req, res) => {
  register(req, res);
});

app.put("/updateList/:id", (req, res) => {
  updateList(req, res);
});

app.delete("/deleteList/:id", (req, res) => {
  deleteList(req, res);
});

app.post("/searchPage", (req, res) => {
  searchPage(req, res);
});

app.post("/searchVague", (req, res) => {
  searchVague(req, res);
});

// 新建存放临时文件的文件夹
const upload_tmp = multer({ dest: "upload_tmp/" });
app.post("/upload", upload_tmp.any(), (req, res) => {
  upload(req, res);
});

app.post("/uploadHomeworkContent", upload_tmp.any(), (req, res) => {
  uploadHomeworkContent(req, res);
});

app.get("/captcha", (req, res) => {
  captcha(req, res);
});

app.get("/getAsyncRoutes", (req, res) => {
  asyncRoutes(req, res);
});

app.ws("/socket", function (ws, req) {
  ws.send(
    `${dayjs(new Date()).format("YYYY年MM月DD日HH时mm分ss秒")}成功连接socket`
  );

  // 监听客户端是否关闭socket
  ws.on("close", function (msg) {
    console.log("客户端已关闭socket", msg);
    ws.close();
  });

  // 监听客户端发送的消息
  ws.on("message", function (msg) {
    // 如果客户端发送close，服务端主动关闭该socket
    if (msg === "close") ws.close();

    ws.send(
      `${dayjs(new Date()).format(
        "YYYY年MM月DD日HH时mm分ss秒"
      )}接收到客户端发送的信息，服务端返回信息：${msg}`
    );
  });
});

app.post("/publishHomework", (req, res) => {
  publishHomework(req, res);
});

app.get("/deletePublishedHomework", (req, res) => {
  deletePublishedHomework(req, res);
});

app.post("/updatePublishedHomework", (req, res) => {
  updatePublishedHomework(req, res);
});

app.get("/getHomeworks", (req, res) => {
  getHomeworks(req, res);
});

app.get("/getHomeworkImages", (req, res) => {
  getHomeworkImages(req, res);
});

app.get("/getHomeworkStates", (req, res) => {
  getHomeworkStates(req, res);
});

// 新建存放临时文件的文件夹
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "homework_tmp/");
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    cb(null, timestamp + "-" + file.originalname);
  },
});
const homework_tmp = multer({ storage: storage });
app.post("/submitHomework", homework_tmp.any(), (req, res) => {
  submitHomework(req, res);
});

app.get("/deleteSubmitedHomework", (req, res) => {
  deleteSubmitedHomework(req, res);
});

app.get("/getProfile", (req, res) => {
  getProfile(req, res);
});

app.post("/updateProfile", (req, res) => {
  updateProfile(req, res);
});
app
  .listen(config.port, () => {
    Logger.info(`
    ################################################
    🛡️  Swagger文档地址: http://localhost:${config.port} 🛡️
    ################################################
  `);
  })
  .on("error", (err) => {
    Logger.error(err);
    process.exit(1);
  });

// open(`http://localhost:${config.port}`); // 自动打开默认浏览器
