#!/bin/bash

API_URL="http://localhost:5000/api"

echo " Probando WebShield Backend..."

# Test 1: Registro de usuario
echo "Probando registro de usuario..."
REGISTER_RESPONSE=$(curl -s -X POST ${API_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@webshield.com","password":"test123","plan":"free"}')

if echo $REGISTER_RESPONSE | grep -q "token"; then
  echo " Registro exitoso"
  TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  echo " Error en registro: $REGISTER_RESPONSE"
  exit 1
fi

# Test 2: Login
echo " Probando login..."
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@webshield.com","password":"test123"}')

if echo $LOGIN_RESPONSE | grep -q "token"; then
  echo " Login exitoso"
else
  echo " Error en login: $LOGIN_RESPONSE"
fi

# Test 3: Crear proyecto
echo "Probando creación de proyecto..."
PROJECT_RESPONSE=$(curl -s -X POST ${API_URL}/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Proyecto de Prueba"}')

if echo $PROJECT_RESPONSE | grep -q "project"; then
  echo " Proyecto creado exitosamente"
  PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
else
  echo " Error creando proyecto: $PROJECT_RESPONSE"
fi

# Test 4: Agregar elemento
echo " Probando agregar elemento..."
ELEMENT_RESPONSE=$(curl -s -X POST ${API_URL}/projects/${PROJECT_ID}/elements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"text","settings":{"content":"Hola WebShield!"}}')

if echo $ELEMENT_RESPONSE | grep -q "element"; then
  echo " Elemento agregado exitosamente"
else
  echo " Error agregando elemento: $ELEMENT_RESPONSE"
fi

echo ""
echo " Todas las pruebas completadas!"
