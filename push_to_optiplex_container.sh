echo "Migrating Prisma Changes"

npx prisma migrate deploy

echo "Building Docker image..."

docker build -t trade_machine_v2 .

docker tag trade_machine_v2:latest 192.168.1.105:5000/trade_machine_v2:latest

docker push 192.168.1.105:5000/trade_machine_v2:latest

echo "Push Success!"

curl http://192.168.1.105:5000/v2/trade_machine_v2/tags/list