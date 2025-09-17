#!/bin/bash

echo "🚀 Iniciando WebShield - Constructor Web Seguro"

# Verificar que PostgreSQL está corriendo
if ! pg_isready -h localhost -p 5432; then
    echo "❌ PostgreSQL no está corriendo. Iniciando..."
    sudo systemctl start postgresql
fi

# Función para mostrar logs con colores
show_logs() {
    local service=$1
    local color=$2
    while IFS= read -r line; do
        echo -e "\033[${color}m[${service}]\033[0m $line"
    done
}

# Iniciar backend
echo "📊 Iniciando Backend..."
cd webshield-backend
npm run dev 2>&1 | show_logs "BACKEND" "36" &
BACKEND_PID=$!

# Esperar un poco para que el backend inicie
sleep 3

# Iniciar frontend
echo "🎨 Iniciando Frontend..."
cd ../webshield
npm start 2>&1 | show_logs "FRONTEND" "35" &
FRONTEND_PID=$!

echo ""
echo "✅ WebShield iniciado exitosamente!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "📊 Base de datos: PostgreSQL en puerto 5432"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Función para cleanup al salir
cleanup() {
    echo ""
    echo "🔄 Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servicios detenidos"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Esperar a que los procesos terminen
wait $BACKEND_PID $FRONTEND_PID
