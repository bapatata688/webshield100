
# 🛡️ WebShield

Construye páginas web seguras, profesionales y con planes de suscripción. WebShield es una app full-stack con autenticación, gestión de proyectos, elementos dinámicos y exportación de HTML.

---

## ✅ Características principales

- Registro / Login con hashing de contraseñas (bcrypt + JWT).  
- Roles de usuario: **free**, **pro** y **premium**, con diferentes permisos.  
- CRUD de proyectos y elementos (texto, imagen, botón, formulario, galería, menú).  
- Exporta tu proyecto como HTML limpio.  
- Base de datos PostgreSQL gestionada en la nube (Render).  
- Código organizado backend + frontend + gestión de planes.  

---

## 🚀 Demo y despliegue

Tu backend está desplegado en [Render](https://render.com), y se conecta desde el frontend mediante la URL proporcionada.  
Puedes clonar este repositorio, configurar las variables de entorno y desplegar tu propia versión.

---

## 💼 Estructura del repositorio
/frontend → Aplicación React (JSX) para la interfaz de usuario
/backend → API Express con autenticación, lógica de proyecto/elements
/database → Scripts SQL o migraciones
Dockerfile.* → Contenedores para desarrollo/producción
docker-compose.yml → Orquestación local
run-webshield.sh → Helper scripts

---

## 🛠️ Instalación local

1. Clona este repositorio:

   ```bash
   git clone https://github.com/bapatata688/webshield100.git
   cd webshield100 
   🔒 Seguridad

Las contraseñas se guardan hashed con bcrypt.

Autenticación basada en JWT.

Conexión segura a la base de datos usando ssl: { rejectUnauthorized: false } si tu proveedor lo requiere.

Rutas protegidas según el plan de usuario.

📦 Producción / despliegue en Render

Activa variables de entorno en Render Dashboard: DATABASE_URL, JWT_SECRET, etc.

Conecta los repositorios de backend y frontend a Render como servicios separados: backend como Web Service, frontend como Static Site.

Verify rutas API desde frontend para que apunten correctamente al backend desplegado.

🤝 Contribución

Si quieres colaborar:

Abre un issue para discutir funcionalidades nuevas.

Haz fork, crea un branch con nombre descriptivo (feature/nueva-función), haz los cambios, pruebas unitarias (si tienes), y haz pull request.

Revisa que los endpoints sigan funcionando correctamente: login, exportar HTML, CRUD de proyectos y elementos.

📄 Licencia

Este proyecto está bajo la licencia MIT. Puedes reutilizarlo, modificarlo y distribuirlo, siempre que mantengas los créditos originales

