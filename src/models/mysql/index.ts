/** 创建用户表 */
const user =
  "CREATE TABLE if not EXISTS users(id int PRIMARY key auto_increment,username varchar(32),password varchar(32),time DATETIME)";

/** 创建homework表 */
const homework =
  "CREATE TABLE if NOT EXISTS homeworks(id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, deadline DATETIME NOT NULL, content TEXT NOT NULL)";
export { user, homework };
