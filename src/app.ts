import * as express from "express";
import * as expressWs from "express-ws";
import * as bodyParser from "body-parser";
const cors = require("cors");

class App {
  public app;
  constructor() {
    this.app = express();
    this.config();
  }
  private config(): void {
    // 支持websocket
    expressWs(this.app);
    // 支持json编码的主体
    this.app.use(bodyParser.json());
    // 支持编码的主体
    this.app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
    this.app.use(cors());
    // 设置静态访问目录(Swagger)
    this.app.use(express.static("public"));
    // 设置跨域访问
    this.app.all("*", (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "content-type");
      res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
      res.header("X-Powered-By", " 3.2.1");
      res.header("Content-Type", "application/json;charset=utf-8");
      next();
    });
  }
}

export default new App().app;
