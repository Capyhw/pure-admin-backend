import * as fs from "fs";
import secret from "../config";
import * as mysql from "mysql2";
import * as jwt from "jsonwebtoken";
import { createHash } from "crypto";
import Logger from "../loaders/logger";
import { Message } from "../utils/enums";
import getFormatDate from "../utils/date";
import { connection } from "../utils/mysql";
import { Request, Response } from "express";
import { createMathExpr } from "svg-captcha";

const dayjs = require("dayjs");
const utils = require("@pureadmin/utils");
const path = require("path");
const archiver = require("archiver");
/** 保存验证码 */
let generateVerify: number;

/** 过期时间 单位：毫秒 默认 1分钟过期，方便演示 */
let expiresIn = 60000;

/**
 * @typedef Error
 * @property {string} code.required
 */

/**
 * @typedef Response
 * @property {[integer]} code
 */

// /**
//  * @typedef Login
//  * @property {string} username.required - 用户名 - eg: admin
//  * @property {string} password.required - 密码 - eg: admin123
//  * @property {integer} verify.required - 验证码
//  */

/**
 * @typedef Login
 * @property {string} username.required - 用户名 - eg: admin
 * @property {string} password.required - 密码 - eg: admin123
 */

/**
 * @route POST /login
 * @param {Login.model} point.body.required - the new point
 * @produces application/json application/xml
 * @consumes application/json application/xml
 * @summary 登录
 * @group 用户登录、注册相关
 * @returns {Response.model} 200
 * @returns {Array.<Login>} Login
 * @headers {integer} 200.X-Rate-Limit
 * @headers {string} 200.X-Expires-After
 * @security JWT
 */

const login = async (req: Request, res: Response) => {
  // const { username, password, verify } = req.body;
  // if (generateVerify !== verify) return res.json({
  //   success: false,
  // data: {
  //   message: Message[0];
  // }
  // })
  const { username, password } = req.body;
  let sql: string =
    "select * from users where username=" + "'" + username + "'";
  connection.query(sql, async function (err, data: any) {
    if (data.length == 0) {
      await res.json({
        success: false,
        data: { message: Message[1] },
      });
    } else {
      if (
        createHash("md5").update(password).digest("hex") == data[0].password
      ) {
        const accessToken = jwt.sign(
          {
            accountId: data[0].id,
          },
          secret.jwtSecret,
          { expiresIn }
        );
        if (username === "admin") {
          await res.json({
            success: true,
            data: {
              message: Message[2],
              username,
              // 这里模拟角色，根据自己需求修改
              roles: ["admin"],
              accessToken,
              // 这里模拟刷新token，根据自己需求修改
              refreshToken: "eyJhbGciOiJIUzUxMiJ9.adminRefresh",
              expires: new Date(new Date()).getTime() + expiresIn,
              // 这个标识是真实后端返回的接口，只是为了演示
              pureAdminBackend:
                "这个标识是pure-admin-backend真实后端返回的接口，只是为了演示",
            },
          });
        } else {
          await res.json({
            success: true,
            data: {
              message: Message[2],
              username,
              // 这里模拟角色，根据自己需求修改
              roles: ["common"],
              accessToken,
              // 这里模拟刷新token，根据自己需求修改
              refreshToken: "eyJhbGciOiJIUzUxMiJ9.adminRefresh",
              expires: new Date(new Date()).getTime() + expiresIn,
              // 这个标识是真实后端返回的接口，只是为了演示
              pureAdminBackend:
                "这个标识是pure-admin-backend真实后端返回的接口，只是为了演示",
            },
          });
        }
      } else {
        await res.json({
          success: false,
          data: { message: Message[3] },
        });
      }
    }
  });
};

// /**
//  * @typedef Register
//  * @property {string} username.required - 用户名
//  * @property {string} password.required - 密码
//  * @property {integer} verify.required - 验证码
//  */
/**
 * @typedef Register
 * @property {string} username.required - 用户名
 * @property {string} password.required - 密码
 */

/**
 * @route POST /register
 * @param {Register.model} point.body.required - the new point
 * @produces application/json application/xml
 * @consumes application/json application/xml
 * @summary 注册
 * @group 用户登录、注册相关
 * @returns {Response.model} 200
 * @returns {Array.<Register>} Register
 * @headers {integer} 200.X-Rate-Limit
 * @headers {string} 200.X-Expires-After
 * @security JWT
 */

const register = async (req: Request, res: Response) => {
  // const { username, password, verify } = req.body;
  const { username, password } = req.body;
  // if (generateVerify !== verify)
  //   return res.json({
  //     success: false,
  //     data: { message: Message[0] },
  //   });
  if (password.length < 6)
    return res.json({
      success: false,
      data: { message: Message[4] },
    });
  let sql: string =
    "select * from users where username=" + "'" + username + "'";
  connection.query(sql, async (err, data: any) => {
    if (data.length > 0) {
      await res.json({
        success: false,
        data: { message: Message[5] },
      });
    } else {
      let time = await getFormatDate();
      let sql: string =
        "insert into users (username,password,time) value(" +
        "'" +
        username +
        "'" +
        "," +
        "'" +
        createHash("md5").update(password).digest("hex") +
        "'" +
        "," +
        "'" +
        time +
        "'" +
        ")";
      connection.query(sql, async function (err) {
        if (err) {
          Logger.error(err);
        } else {
          await res.json({
            success: true,
            data: { message: Message[6] },
          });
        }
      });
    }
  });
};

/**
 * @typedef UpdateList
 * @property {string} username.required - 用户名 - eg: admin
 */

/**
 * @route PUT /updateList/{id}
 * @summary 列表更新
 * @param {UpdateList.model} point.body.required - 用户名
 * @param {UpdateList.model} id.path.required - 用户id
 * @group 用户管理相关
 * @returns {object} 200
 * @returns {Array.<UpdateList>} UpdateList
 * @security JWT
 */

const updateList = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username } = req.body;
  let payload = null;
  try {
    const authorizationHeader = req.get("Authorization") as string;
    const accessToken = authorizationHeader.substr("Bearer ".length);
    payload = jwt.verify(accessToken, secret.jwtSecret);
  } catch (error) {
    return res.status(401).end();
  }
  let modifySql: string = "UPDATE users SET username = ? WHERE id = ?";
  let sql: string = "select * from users where id=" + id;
  connection.query(sql, function (err, data) {
    connection.query(sql, function (err) {
      if (err) {
        Logger.error(err);
      } else {
        let modifyParams: string[] = [username, id];
        // 改
        connection.query(modifySql, modifyParams, async function (err, result) {
          if (err) {
            Logger.error(err);
          } else {
            await res.json({
              success: true,
              data: { message: Message[7] },
            });
          }
        });
      }
    });
  });
};

/**
 * @typedef DeleteList
 * @property {integer} id.required - 当前id
 */

/**
 * @route DELETE /deleteList/{id}
 * @summary 列表删除
 * @param {DeleteList.model} id.path.required - 用户id
 * @group 用户管理相关
 * @returns {object} 200
 * @returns {Array.<DeleteList>} DeleteList
 * @security JWT
 */

const deleteList = async (req: Request, res: Response) => {
  const { id } = req.params;
  let payload = null;
  try {
    const authorizationHeader = req.get("Authorization") as string;
    const accessToken = authorizationHeader.substr("Bearer ".length);
    payload = jwt.verify(accessToken, secret.jwtSecret);
  } catch (error) {
    return res.status(401).end();
  }
  let sql: string = "DELETE FROM users where id=" + "'" + id + "'";
  connection.query(sql, async function (err, data) {
    if (err) {
      console.log(err);
    } else {
      await res.json({
        success: true,
        data: { message: Message[8] },
      });
    }
  });
};

/**
 * @typedef SearchPage
 * @property {integer} page.required - 第几页 - eg: 1
 * @property {integer} size.required - 数据量（条）- eg: 5
 */

/**
 * @route POST /searchPage
 * @param {SearchPage.model} point.body.required - the new point
 * @produces application/json application/xml
 * @consumes application/json application/xml
 * @summary 分页查询
 * @group 用户管理相关
 * @returns {Response.model} 200
 * @returns {Array.<SearchPage>} SearchPage
 * @headers {integer} 200.X-Rate-Limit
 * @headers {string} 200.X-Expires-After
 * @security JWT
 */

const searchPage = async (req: Request, res: Response) => {
  const { page, size } = req.body;
  let payload = null;
  try {
    const authorizationHeader = req.get("Authorization") as string;
    const accessToken = authorizationHeader.substr("Bearer ".length);
    payload = jwt.verify(accessToken, secret.jwtSecret);
  } catch (error) {
    return res.status(401).end();
  }
  let sql: string =
    "select * from users limit " + size + " offset " + size * (page - 1);
  connection.query(sql, async function (err, data) {
    if (err) {
      Logger.error(err);
    } else {
      await res.json({
        success: true,
        data,
      });
    }
  });
};

/**
 * @typedef SearchVague
 * @property {string} username.required - 用户名  - eg: admin
 */

/**
 * @route POST /searchVague
 * @param {SearchVague.model} point.body.required - the new point
 * @produces application/json application/xml
 * @consumes application/json application/xml
 * @summary 模糊查询
 * @group 用户管理相关
 * @returns {Response.model} 200
 * @returns {Array.<SearchVague>} SearchVague
 * @headers {integer} 200.X-Rate-Limit
 * @headers {string} 200.X-Expires-After
 * @security JWT
 */

const searchVague = async (req: Request, res: Response) => {
  const { username } = req.body;
  let payload = null;
  try {
    const authorizationHeader = req.get("Authorization") as string;
    const accessToken = authorizationHeader.substr("Bearer ".length);
    payload = jwt.verify(accessToken, secret.jwtSecret);
  } catch (error) {
    return res.status(401).end();
  }
  if (username === "" || username === null)
    return res.json({
      success: false,
      data: { message: Message[9] },
    });
  let sql: string = "select * from users";
  sql += " WHERE username LIKE " + mysql.escape("%" + username + "%");
  connection.query(sql, function (err, data) {
    connection.query(sql, async function (err) {
      if (err) {
        Logger.error(err);
      } else {
        await res.json({
          success: true,
          data,
        });
      }
    });
  });
};

// express-swagger-generator中没有文件上传文档写法，所以请使用postman调试
const upload = async (req: Request, res: Response) => {
  // 文件存放地址
  const des_file: any = (index: number) =>
    "./public/files/" + req.files[index].originalname;
  let filesLength = req.files?.length as number;
  let result = [];

  function asyncUpload() {
    return new Promise((resolve, rejects) => {
      (req.files as Array<any>).forEach((ev, index) => {
        fs.readFile(req.files[index].path, function (err, data) {
          fs.writeFile(des_file(index), data, function (err) {
            if (err) {
              rejects(err);
            } else {
              while (filesLength > 0) {
                result.push({
                  filename: req.files[filesLength - 1].originalname,
                  filepath: utils.getAbsolutePath(des_file(filesLength - 1)),
                });
                filesLength--;
              }
              if (filesLength === 0) resolve(result);
            }
          });
        });
      });
    });
  }

  asyncUpload()
    .then((fileList) => {
      res.json({
        success: true,
        errno: 0,
        data: {
          message: Message[11],
          url: `http://127.0.0.1:3000/files/${fileList[0]["filename"]}`,
        },
      });
    })
    .catch(() => {
      res.json({
        success: false,
        errno: 1,
        data: {
          message: Message[10],
        },
      });
    });
};

const uploadHomeworkContent = async (req: Request, res: Response) => {
  const { id } = req.body;
  // 文件存放地址
  const des_file = (index) => {
    const filename = decodeURIComponent(req.files[index].filename);
    return path.join(
      "./public/publishedHomeworkContent",
      id,
      filename + path.extname(decodeURIComponent(req.files[index].originalname))
    );
  };

  let filesLength = req.files?.length as number;
  let result = [];

  function asyncUpload() {
    return new Promise((resolve, reject) => {
      (req.files as Array<any>).forEach((ev, index) => {
        const filePath = des_file(index);
        const dirPath = path.dirname(filePath); // 获取目录路径
        fs.mkdir(dirPath, { recursive: true }, (err) => {
          if (err) {
            reject(err);
            return;
          }
          fs.readFile(req.files[index].path, function (err, data) {
            fs.writeFile(filePath, data, function (err) {
              if (err) {
                reject(err);
              } else {
                while (filesLength > 0) {
                  result.push({
                    filename:
                      req.files[filesLength - 1].filename +
                      path.extname(req.files[filesLength - 1].originalname),
                    filepath: utils.getAbsolutePath(des_file(filesLength - 1)),
                  });
                  filesLength--;
                }
                if (filesLength === 0) resolve(result);
              }
            });
          });
        });
      });
    });
  }

  asyncUpload()
    .then((fileList) => {
      res.json({
        success: true,
        errno: 0,
        data: {
          message: Message[11],
          url: `http://127.0.0.1:3000/publishedHomeworkContent/${id}/${fileList[0]["filename"]}`,
        },
      });
    })
    .catch(() => {
      res.json({
        success: false,
        errno: 1,
        data: {
          message: Message[10],
        },
      });
    });
};
/**
 * @route GET /captcha
 * @summary 图形验证码
 * @group captcha - 图形验证码
 * @returns {object} 200
 */

const captcha = async (req: Request, res: Response) => {
  const create = createMathExpr({
    mathMin: 1,
    mathMax: 4,
    mathOperator: "+",
  });
  generateVerify = Number(create.text);
  res.type("svg"); // 响应的类型
  res.json({ success: true, data: { text: create.text, svg: create.data } });
};

/** 提交作业 */
const submitHomework = async (req: Request, res: Response) => {
  const {
    id,
    title,
    deadline,
    content,
    isSubmit,
    status,
    score,
    name,
    studentID,
    class: class_,
    phoneNumber,
    email,
  } = req.body;
  // 文件存放地址
  const des_file = (index) => {
    const originalname = decodeURIComponent(req.files[index].originalname);

    return path.join("./public/homework", id, class_, studentID, originalname);
  };

  let filesLength = req.files?.length as number;
  let result = [];

  function asyncUpload() {
    return new Promise((resolve, reject) => {
      (req.files as Array<any>).forEach((ev, index) => {
        const filePath = des_file(index);
        const dirPath = path.dirname(filePath); // 获取目录路径
        fs.mkdir(dirPath, { recursive: true }, (err) => {
          if (err) {
            reject(err);
            return;
          }
          fs.readFile(req.files[index].path, function (err, data) {
            fs.writeFile(filePath, data, function (err) {
              if (err) {
                reject(err);
              } else {
                while (filesLength > 0) {
                  result.push({
                    filename: req.files[filesLength - 1].originalname,
                    filepath: utils.getAbsolutePath(des_file(filesLength - 1)),
                  });
                  filesLength--;
                }
                if (filesLength === 0) resolve(result);
              }
            });
          });
        });
      });
    });
  }
  asyncUpload()
    .then((fileList) => {
      let sql: string =
        "INSERT INTO submissions (homeworkID, studentID, `class`, states, submitTime) VALUES (?, ?, ?, ?, ?)";
      let values = [
        id,
        studentID,
        class_,
        1,
        dayjs().format("YYYY-MM-DD HH:mm:ss"),
      ];

      connection.query(sql, values, async function (err, results) {
        if (err) {
          Logger.error(err);
        } else {
          res.json({
            results,
            success: true,
            errno: 0,
          });
        }
      });
    })
    .catch(() => {
      res.json({
        success: false,
        errno: 1,
        data: {
          message: Message[10],
        },
      });
    });
};
/** 保存批改后的作业 */
const saveCorrectedHomework = async (req: Request, res: Response) => {
  const { id, score, studentID, class: class_ } = req.body;
  // 文件存放地址
  const des_file = (index) => {
    const originalname = decodeURIComponent(req.files[index].originalname);
    return path.join("./public/homework", id, class_, studentID, originalname);
  };

  let filesLength = req.files?.length as number;
  let result = [];

  function asyncUpload() {
    return new Promise((resolve, reject) => {
      (req.files as Array<any>).forEach((ev, index) => {
        const filePath = des_file(index);
        const dirPath = path.dirname(filePath); // 获取目录路径
        fs.mkdir(dirPath, { recursive: true }, (err) => {
          if (err) {
            reject(err);
            return;
          }
          fs.readFile(req.files[index].path, function (err, data) {
            fs.writeFile(filePath, data, function (err) {
              if (err) {
                reject(err);
              } else {
                while (filesLength > 0) {
                  result.push({
                    filename: req.files[filesLength - 1].originalname,
                    filepath: utils.getAbsolutePath(des_file(filesLength - 1)),
                  });
                  filesLength--;
                }
                if (filesLength === 0) resolve(result);
              }
            });
          });
        });
      });
    });
  }
  asyncUpload()
    .then((fileList) => {
      let sql: string = `UPDATE submissions SET states=2, score='${score}' WHERE homeworkID='${id}' AND studentID='${studentID}';`;

      connection.query(sql, async function (err, results) {
        if (err) {
          Logger.error(err);
        } else {
          res.json({
            results,
            success: true,
            errno: 0,
          });
        }
      });
    })
    .catch(() => {
      res.json({
        success: false,
        errno: 1,
        data: {
          message: Message[10],
        },
      });
    });
};
/** 给出分数 */
const postScore = async (req: Request, res: Response) => {
  const { id, score, studentID } = req.body;
  let sql: string = `UPDATE submissions SET score='${score}' WHERE homeworkID='${id}' AND studentID='${studentID}';`;

  connection.query(sql, async function (err, results) {
    if (err) {
      Logger.error(err);
    } else {
      res.json({
        results,
        success: true,
        errno: 0,
      });
    }
  });
};
/** 获取分数 */
const getScore = async (req: Request, res: Response) => {
  const { studentID } = req.query;

  connection.query(
    `SELECT * FROM submissions WHERE studentID = '${studentID}'`,
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      } else {
        res.json({
          success: true,
          data: {
            results,
          },
        });
      }
    }
  );
};
/** 删除已提交的作业 */
const deleteSubmitedHomework = async (req: Request, res: Response) => {
  const { class: class_, id, studentID } = req.query;
  // 删除目录下所有文件
  const deleteFiles = async (dirPath) => {
    try {
      const files = await fs.promises.readdir(dirPath); // 读取目录中的所有文件和文件夹
      for (const file of files) {
        const filePath = path.join(dirPath, file); // 拼接文件路径
        const stat = await fs.promises.stat(filePath); // 获取文件/文件夹的状态信息
        if (stat.isDirectory()) {
          await deleteFiles(filePath); // 递归删除子文件夹
        } else {
          await fs.promises.unlink(filePath); // 删除文件
        }
      }
      await fs.promises.rmdir(dirPath); // 删除空文件夹
    } catch (err) {
      console.error(err);
    }
  };

  let sql1 = `UPDATE homeworks SET isSubmit = false, status = 0 WHERE id = ${id}`;
  connection.query(sql1, (error1, results1, fields1) => {
    if (error1) {
      console.error(error1);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    } else {
      // 第一个查询成功，执行第二个查询
      console.log(id, studentID);

      let sql2 = `DELETE FROM submissions WHERE homeworkID = ${id} AND studentID = ${studentID}`;
      connection.query(sql2, async (error2, results2, fields2) => {
        if (error2) {
          console.error(error2);
          res
            .status(500)
            .json({ success: false, message: "Internal server error." });
        } else {
          // 第二个查询成功，删除文件夹中的文件
          await deleteFiles(
            path.join("./public/homework", id, class_, studentID)
          );

          // 返回查询结果
          res.json({
            success: true,
            data: {
              results: [results1, results2],
            },
          });
        }
      });
    }
  });
};
/** 发布作业 */
const publishHomework = async (req: Request, res: Response) => {
  const { title, deadline, content, isSubmit, status, score } = req.body;
  const newHomework = {
    title,
    deadline,
    content,
    isSubmit,
    status,
    score,
  };
  // 插入新作业数据到MySQL数据库中
  connection.query(
    "INSERT INTO homeworks SET ?",
    newHomework,
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      } else {
        // 返回成功的响应，包括新作业的ID和详情
        res.json({
          success: true,
          data: {
            newHomework,
          },
        });
      }
    }
  );
};

/** 删除已发布作业 */
const deletePublishedHomework = async (req: Request, res: Response) => {
  const { id } = req.query;

  // 删除目录下所有文件
  const deleteFiles = async (dirPath) => {
    try {
      const files = await fs.promises.readdir(dirPath); // 读取目录中的所有文件和文件夹
      for (const file of files) {
        const filePath = path.join(dirPath, file); // 拼接文件路径
        const stat = await fs.promises.stat(filePath); // 获取文件/文件夹的状态信息
        if (stat.isDirectory()) {
          await deleteFiles(filePath); // 递归删除子文件夹
        } else {
          await fs.promises.unlink(filePath); // 删除文件
        }
      }
      await fs.promises.rmdir(dirPath); // 删除空文件夹
    } catch (err) {
      console.error(err);
    }
  };
  let sql1 = `DELETE FROM homeworks WHERE id=${id};`;
  connection.query(sql1, (error1, results1, fields1) => {
    if (error1) {
      console.error(error1);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    } else {
      // 第一个查询成功，执行第二个查询
      let sql2 = `DELETE FROM submissions WHERE homeworkID = ${id}`;
      connection.query(sql2, async (error2, results2, fields2) => {
        if (error2) {
          console.error(error2);
          res
            .status(500)
            .json({ success: false, message: "Internal server error." });
        } else {
          // 第二个查询成功，删除文件夹中的文件
          await deleteFiles(path.join("./public/homework", id));

          // 返回查询结果
          res.json({
            success: true,
            data: {
              results: [results1, results2],
            },
          });
        }
      });
    }
  });
};

/** 修改已发布作业 */
const updatePublishedHomework = async (req: Request, res: Response) => {
  const { id, title, deadline, content } = req.body;

  let sql: string = `UPDATE homeworks SET title = '${title}', deadline = '${deadline}',content = '${content}' WHERE id = ${id};`;
  connection.query(sql, function (err, data) {
    connection.query(sql, async function (err) {
      if (err) {
        Logger.error(err);
      } else {
        res.json({
          success: true,
          errno: 0,
          data,
        });
      }
    });
  });
};

/** 获取全部作业 */
const getHomeworks = async (req: Request, res: Response) => {
  connection.query(
    "SELECT *  FROM homeworks  ORDER BY  deadline ASC",
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      } else {
        res.json({
          success: true,
          data: {
            results,
          },
        });
      }
    }
  );
};
/** 获取作业图片 */
const getHomeworkImages = async (req: Request, res: Response) => {
  // 文件夹路径
  const homeworkDir = "./public/homework";

  // 递归函数，遍历整个文件夹结构
  function traverse(dir, result) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // 如果是文件夹，则递归遍历
        traverse(filePath, result);
      } else {
        // 如果是文件，则构建作业对象
        const [homeworkId, className, studentId, imageName] = filePath
          .split(path.sep)
          .slice(-4);
        const homework = result.find((h) => h.id === homeworkId) || {
          id: homeworkId,
          disabled: true,
          children: [],
        };
        const clazz = homework.children.find((c) => c.id === className) || {
          id: className,
          children: [],
        };
        let student = clazz.children.find((s) => s.id === studentId);
        if (!student) {
          student = { id: studentId, images: [] };
          clazz.children.push(student);
        }
        const image = { name: imageName, path: filePath };
        student.images.push(image);
        if (!homework.children.includes(clazz)) {
          homework.children.push(clazz);
        }
        if (!result.includes(homework)) {
          result.push(homework);
        }
      }
    }
  }

  // 构建数组对象
  const result = [];
  traverse(homeworkDir, result);
  res.json({ success: true, result });
};
/** 查询作业情况 */
const getHomeworkStates = async (req: Request, res: Response) => {
  const { studentID } = req.query;
  connection.query(
    `SELECT *  FROM submissions WHERE studentID='${studentID}'`,
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      } else {
        res.json({
          success: true,
          data: {
            results,
          },
        });
      }
    }
  );
};
/** 获取个人信息 */
const getProfile = async (req: Request, res: Response) => {
  const { username } = req.query;

  connection.query(
    `SELECT name, studentID, phoneNumber, email, class FROM users WHERE username = '${username}'`,
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      } else {
        res.json({
          success: true,
          data: {
            results,
          },
        });
      }
    }
  );
};

/** 修改个人信息 */
const updateProfile = async (req: Request, res: Response) => {
  const {
    username,
    name,
    studentID,
    phoneNumber,
    email,
    class: class_,
  } = req.body;
  let sql: string = `UPDATE users SET name = '${name}', studentID = ${studentID},phoneNumber = '${phoneNumber}',email = '${email}',class = '${class_}' WHERE username = '${username}';`;
  connection.query(sql, function (err, data) {
    connection.query(sql, async function (err) {
      if (err) {
        Logger.error(err);
      } else {
        res.json({
          success: true,
          errno: 0,
          data,
        });
      }
    });
  });
};

/** 打包下载作业 */
const downloadHomework = async (req: Request, res: Response) => {
  const folderPath = "./public/homework";
  const absoluteFolderPath = path.resolve(folderPath);
  const zipFileName = `${path.basename(absoluteFolderPath)}.zip`;
  const absoluteZipFilePath = path.join(__dirname, zipFileName);

  // 创建zip输出流
  const output = fs.createWriteStream(absoluteZipFilePath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  // 将zip输出流管道到输出流
  archive.pipe(output);
  // 添加文件夹到zip
  archive.directory(absoluteFolderPath, false);

  // 监听zip输出流关闭事件
  output.on("close", () => {
    // 将zip文件发送给前端
    res.sendFile(absoluteZipFilePath, (err) => {
      if (err) {
        console.error(err);
      }
      // 删除zip文件
      fs.unlinkSync(absoluteZipFilePath);
    });
  });

  // 完成zip打包
  archive.finalize(() => {
    console.log("Archive finalize done");
  });
};

/** 权限管理 菜单 */
const adminRouter = {
  path: "/permission",
  meta: {
    title: "权限管理",
    icon: "lollipop",
    rank: 10,
    showLink: false,
  },
  children: [
    {
      path: "/permission/page/index",
      name: "PermissionPage",
      meta: {
        title: "页面权限",
        roles: ["admin"],
      },
    },
    {
      path: "/permission/button/index",
      name: "PermissionButton",
      meta: {
        title: "按钮权限",
        roles: ["admin"],
        auths: ["btn_add", "btn_edit", "btn_delete"],
      },
    },
  ],
};
/** 异常页面 */
const errorPage = {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "informationLine",
    title: "异常页面",
    showLink: false,
    rank: 9,
    roles: ["admin"],
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => "error/403.vue",
      meta: {
        title: "403",
      },
    },
    {
      path: "/error/404",
      name: "404",
      component: () => "error/404.vue",
      meta: {
        title: "404",
      },
    },
    {
      path: "/error/500",
      name: "500",
      component: () => "error/500.vue",
      meta: {
        title: "500",
      },
    },
  ],
};
/** 批改作业 */
const correctHomeworkRouter = {
  path: "/correctHomework",
  meta: {
    title: "批改作业",
    icon: "fluent-mdl2:account-activity",
  },
  children: [
    {
      path: "/correctHomework/index",
      name: "CorrectHomework",
      component: "correctHomework/index",
      meta: {
        title: "批改作业",
        keepAlive: true,
        roles: ["admin"],
      },
    },
  ],
};
/** 提交作业 */
const submitHomeworkRouter = {
  path: "/submitHomework",
  meta: {
    title: "提交作业",
    icon: "iconoir:submit-document",
    roles: ["common"],
  },
  children: [
    {
      path: "/submitHomework/index",
      name: "SubmitHomework",
      component: () => "submitHomework/index",
      meta: {
        title: "提交作业",
        keepAlive: true,
      },
    },
  ],
};

/** 作业管理 */
const manageHomeworkRouter = {
  path: "/manageHomework",
  meta: {
    title: "作业管理",
    icon: "material-symbols:bookmark-manager-rounded",
    roles: ["admin"],
  },
  children: [
    {
      path: "/manageHomework/index",
      name: "ManageHomework",
      component: () => "manageHomework/index",
      meta: {
        title: "作业管理",
        keepAlive: true,
      },
    },
  ],
};
/** 导入名单 */
const importXlsxRouter = {
  path: "/importXlsx",
  meta: {
    title: "导入名单",
    icon: "material-symbols:publish",
    roles: ["admin"],
  },
  children: [
    {
      path: "/importXlsx/index",
      name: "ImportXlsx",
      component: () => "importXlsx/index",
      meta: {
        title: "导入名单",
        keepAlive: true,
      },
    },
  ],
};
const asyncRoutes = async (req: Request, res: Response) => {
  res.json({
    success: true,
    back: "这是后端返回的路由",
    data: [
      adminRouter,
      errorPage,
      correctHomeworkRouter,
      submitHomeworkRouter,
      manageHomeworkRouter,
      importXlsxRouter,
    ],
  });
};

export {
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
  saveCorrectedHomework,
  postScore,
  getScore,
  downloadHomework,
};
