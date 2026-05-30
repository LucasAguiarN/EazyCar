import os
import time

from mysql.connector import connect, Error

MYSQL_HOST     = os.environ.get("DB_HOST",     "mysql")
MYSQL_PORT     = int(os.environ.get("DB_PORT", "3306"))
MYSQL_USER     = os.environ.get("DB_USER",     "root")
MYSQL_PASSWORD = os.environ.get("DB_PASSWORD", "")
MYSQL_DATABASE = os.environ.get("DB_NAME",     "railway")


def wait_for_mysql(timeout: int = 120, interval: int = 2) -> None:
    start = time.time()
    while True:
        try:
            print(f"Conectando ao MySQL em {MYSQL_HOST}:{MYSQL_PORT}...")
            with connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE,
                connection_timeout=5,
            ):
                print("MySQL pronto.")
                break
        except Error as error:
            elapsed = time.time() - start
            print(f"MySQL indisponível ({error}), aguardando {interval}s...")
            if elapsed >= timeout:
                raise RuntimeError(
                    f"Não foi possível conectar ao MySQL após {timeout} segundos."
                ) from error
            time.sleep(interval)


if __name__ == "__main__":
    wait_for_mysql()
    port = os.environ.get("PORT", "5000")
    os.execvp("gunicorn", ["gunicorn", "run:app", "--bind", f"0.0.0.0:{port}"])
