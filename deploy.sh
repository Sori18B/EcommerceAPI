#Script de Despliegue
echo "Iniciando despliegue manual a Render..."

DEPLOY_HOOK_URL="https://api.render.com/deploy/srv-d48ln7bipnbc73dik8og?key=0VbJQsDzSc8"

# Petición para forzar el despliegue
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST $DEPLOY_HOOK_URL)

if [ "$response" -eq 200 ]; then
  echo "Solicitud de despliegue enviada con éxito a Render."
else
  echo "Error al solicitar el despliegue. Código: $response"
  exit 1
fi