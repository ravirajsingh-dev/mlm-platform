# Usage: ./push-docker-images.sh 0.0.1
# Set DEPLOY_HOST and REGISTRY before running.
echo "Build: $1"
echo "Starting pushing docker images..."

REGISTRY="${REGISTRY:-registry.example.com/mlm-platform}"
DEPLOY_HOST="${DEPLOY_HOST:-user@your-server}"

echo "cd ~/apps/mlm-platform/"
cd ~/apps/mlm-platform/

echo "docker save -o ./mlm-server.tar $REGISTRY/server:$1"
docker save -o ./mlm-server.tar "$REGISTRY/server:$1"

echo "docker save -o ./mlm-client.tar $REGISTRY/client:$1"
docker save -o ./mlm-client.tar "$REGISTRY/client:$1"

echo "docker save -o ./mlm-admin.tar $REGISTRY/admin:$1"
docker save -o ./mlm-admin.tar "$REGISTRY/admin:$1"

printf "\n\n"

echo "scp mlm-server.tar $DEPLOY_HOST:~/"
scp mlm-server.tar "$DEPLOY_HOST:~/"

echo "scp mlm-client.tar $DEPLOY_HOST:~/"
scp mlm-client.tar "$DEPLOY_HOST:~/"

echo "scp mlm-admin.tar $DEPLOY_HOST:~/"
scp mlm-admin.tar "$DEPLOY_HOST:~/"

rm ./mlm-server.tar
rm ./mlm-client.tar
rm ./mlm-admin.tar
