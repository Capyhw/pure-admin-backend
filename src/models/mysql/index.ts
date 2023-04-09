/** 创建用户表 */
const user =
  "CREATE TABLE IF NOT EXISTS users( id int PRIMARY KEY AUTO_INCREMENT, username varchar(32), password varchar(32), time DATETIME, name VARCHAR(50) DEFAULT NULL, studentID BIGINT DEFAULT NULL, phoneNumber VARCHAR(20) DEFAULT NULL, email VARCHAR(50) DEFAULT NULL, class VARCHAR(50) DEFAULT NULL)";

/** 创建homework表 */
const homework =
  "CREATE TABLE IF NOT EXISTS homeworks (	id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,	title VARCHAR(255) NOT NULL,	deadline DATETIME NOT NULL,	content TEXT NOT NULL,	isSubmit BOOLEAN NOT NULL DEFAULT false,	status TINYINT NOT NULL DEFAULT 0,	score FLOAT DEFAULT NULL)";
export { user, homework };
