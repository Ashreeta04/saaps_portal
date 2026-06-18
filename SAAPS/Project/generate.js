const bcrypt = require("bcryptjs");

bcrypt.hash("123789", 10).then(hash => {
  console.log("👉 Copy this password and use it in your MySQL:");
  console.log(hash);
});
