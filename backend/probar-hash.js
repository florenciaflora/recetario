const bcrypt = require("bcrypt");

const contrasenaOriginal = "miContraseña123";

bcrypt.hash(contrasenaOriginal, 10, (error, hash) => {
  console.log("Hash generado:", hash);

  bcrypt.compare("miContraseña123", hash, (error, coincide) => {
    console.log("¿Coincide la contraseña correcta?", coincide);
  });

  bcrypt.compare("otraCosa", hash, (error, coincideOtra) => {
    console.log("¿Coincide una contraseña incorrecta?", coincideOtra);
  });
});
