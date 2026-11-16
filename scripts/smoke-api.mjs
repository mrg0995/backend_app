// Prueba local con el backend y la base de datos arrancados.
// Usa los usuarios de db/seed.sql y registra otro para comprobar ese flujo.
const base = process.env.API_URL || 'http://localhost:3000/api';
const clave = process.env.TEST_PASSWORD || '12345678';

async function pedir(ruta, opciones = {}) {
  const { headers = {}, ...resto } = opciones;
  const respuesta = await fetch(`${base}${ruta}`, {
    ...resto,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
  const json = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(`${ruta}: HTTP ${respuesta.status} - ${JSON.stringify(json)}`);
  }
  return json;
}

async function comprobarSesion(email, rol) {
  const datos = await pedir('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password: clave })
  });
  if (!datos.token || datos.usuario?.rol !== rol) {
    throw new Error(`Respuesta del login no esperada para ${email}`);
  }
  const perfil = await pedir('/usuarios/perfil', {
    headers: { Authorization: `Bearer ${datos.token}` }
  });
  if (perfil.email !== email || perfil.rol !== rol) {
    throw new Error(`El perfil no coincide para ${email}`);
  }
  console.log(`OK login + perfil: ${email} (${rol})`);
}

async function main() {
  const salud = await pedir('/health');
  if (salud.database !== 'ok') throw new Error('Base de datos sin conexión');
  console.log('OK API + MySQL');

  const email = `prueba_adel_${Date.now()}@example.test`;
  const registrado = await pedir('/auth/registro', {
    method: 'POST',
    body: JSON.stringify({ nombre_usuario: `adel_test_${Date.now()}`, email, password: clave })
  });
  if (!registrado.token || registrado.usuario?.rol !== 'usuario') {
    throw new Error('El registro no devolvió una sesión de usuario');
  }
  console.log('OK registro (se ha creado un usuario de prueba en la BD)');

  await comprobarSesion(email, 'usuario');
  await comprobarSesion('usuario@test.com', 'usuario');
  await comprobarSesion('moderador@test.com', 'moderador');
  await comprobarSesion('admin@test.com', 'administrador');
  console.log('Pruebas terminadas. Revisar también la navegación en Angular.');
}

main().catch(error => { console.error('ERROR:', error.message); process.exitCode = 1; });
