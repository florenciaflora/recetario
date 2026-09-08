const buscarRecetaEnServidor = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ nombre: "Ramen", tiempoMinutos: 45 });
    }, 1500); // simula que tarda 1.5 segundos en responder
  });
};

const mostrarRecetaAsync = async () => {
  console.log("Buscando receta...");
  const receta = await buscarRecetaEnServidor();
  console.log("Encontrada:", receta);
};

mostrarRecetaAsync();

const buscarRecetaConError = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject("Error: mensaje de manejo de errores");
    }, 1000);
  });
};

const mostrarConManejo = async () => {
  try {
    console.log("Buscando receta...");
    const receta = await buscarRecetaConError();
    console.log("Encontrada:", receta);
  } catch (error) {
    console.log("Algo salió mal:", error);
  }
};

mostrarConManejo();
