#!/bin/bash
set -e

# Aguarda o MySQL estar realmente pronto
echo "Aguardando MySQL estar pronto..."
until nc -z mysql 3306; do
  echo "MySQL indisponível, aguardando..."
  sleep 2
done

echo "MySQL está pronto!"

# Aguarda um pouco mais para garantir que está totalmente inicializado
sleep 3

# Inicia o Flask
exec flask run
