#!/usr/bin/env python3
import json
import sqlite3
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

DB_PATH = Path('contas')
HOST = '0.0.0.0'
PORT = 8000


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT NOT NULL UNIQUE,
                senha TEXT NOT NULL,
                dt_cadastro TEXT NOT NULL,
                ultimo_login TEXT
            )
            '''
        )
        conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS contas_pagas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                descricao_da_conta TEXT NOT NULL,
                valor REAL NOT NULL,
                dt_pagamento TEXT NOT NULL,
                observacao TEXT,
                criado_em TEXT NOT NULL
            )
            '''
        )

        now = datetime.utcnow().isoformat()
        conn.execute(
            '''
            INSERT INTO usuarios (usuario, senha, dt_cadastro)
            VALUES (?, ?, ?)
            ON CONFLICT(usuario) DO NOTHING
            ''',
            ('lala', '11082025@laLa#', now),
        )
        conn.commit()


class AppHandler(SimpleHTTPRequestHandler):
    def _send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get('Content-Length', '0'))
        raw = self.rfile.read(length) if length else b'{}'
        return json.loads(raw.decode('utf-8'))

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/contas':
            with get_conn() as conn:
                rows = conn.execute(
                    '''
                    SELECT id, descricao_da_conta, valor, dt_pagamento, COALESCE(observacao, '') AS observacao
                    FROM contas_pagas
                    ORDER BY id DESC
                    '''
                ).fetchall()
            contas = [dict(row) for row in rows]
            return self._send_json({'contas': contas})

        if path in ('/', '/index'):
            self.path = '/login.html'
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path

        if path == '/api/login':
            try:
                payload = self._read_json()
            except json.JSONDecodeError:
                return self._send_json({'ok': False, 'message': 'JSON inválido.'}, status=HTTPStatus.BAD_REQUEST)

            usuario = str(payload.get('usuario', '')).strip()
            senha = str(payload.get('senha', ''))
            if not usuario or not senha:
                return self._send_json({'ok': False, 'message': 'Usuário e senha são obrigatórios.'}, status=HTTPStatus.BAD_REQUEST)

            with get_conn() as conn:
                row = conn.execute(
                    'SELECT id FROM usuarios WHERE usuario = ? AND senha = ?',
                    (usuario, senha),
                ).fetchone()
                if row:
                    conn.execute('UPDATE usuarios SET ultimo_login = ? WHERE id = ?', (datetime.utcnow().isoformat(), row['id']))
                    conn.commit()
                    return self._send_json({'ok': True, 'usuario': usuario})

            return self._send_json({'ok': False, 'message': 'Usuário ou senha inválidos.'}, status=HTTPStatus.UNAUTHORIZED)

        if path == '/api/contas':
            try:
                payload = self._read_json()
            except json.JSONDecodeError:
                return self._send_json({'ok': False, 'message': 'JSON inválido.'}, status=HTTPStatus.BAD_REQUEST)

            descricao = str(payload.get('DESCRICAO_DA_CONTA', '')).strip()
            valor = payload.get('VALOR')
            dt_pagamento = str(payload.get('DT_PAGAMENTO', '')).strip()
            observacao = str(payload.get('OBSERVACAO', '')).strip()

            try:
                valor = float(valor)
            except (TypeError, ValueError):
                return self._send_json({'ok': False, 'message': 'VALOR inválido.'}, status=HTTPStatus.BAD_REQUEST)

            if not descricao or valor <= 0 or not dt_pagamento:
                return self._send_json({'ok': False, 'message': 'Dados obrigatórios inválidos.'}, status=HTTPStatus.BAD_REQUEST)

            with get_conn() as conn:
                cur = conn.execute(
                    '''
                    INSERT INTO contas_pagas (descricao_da_conta, valor, dt_pagamento, observacao, criado_em)
                    VALUES (?, ?, ?, ?, ?)
                    ''',
                    (descricao, valor, dt_pagamento, observacao, datetime.utcnow().isoformat()),
                )
                conn.commit()
                conta_id = cur.lastrowid

            return self._send_json({'ok': True, 'id': conta_id}, status=HTTPStatus.CREATED)

        return self._send_json({'ok': False, 'message': 'Rota não encontrada.'}, status=HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        path = urlparse(self.path).path

        if path == '/api/contas':
            with get_conn() as conn:
                conn.execute('DELETE FROM contas_pagas')
                conn.commit()
            return self._send_json({'ok': True})

        if path.startswith('/api/contas/'):
            conta_id = path.rsplit('/', 1)[-1]
            if not conta_id.isdigit():
                return self._send_json({'ok': False, 'message': 'ID inválido.'}, status=HTTPStatus.BAD_REQUEST)

            with get_conn() as conn:
                cur = conn.execute('DELETE FROM contas_pagas WHERE id = ?', (int(conta_id),))
                conn.commit()
            if cur.rowcount == 0:
                return self._send_json({'ok': False, 'message': 'Conta não encontrada.'}, status=HTTPStatus.NOT_FOUND)
            return self._send_json({'ok': True})

        return self._send_json({'ok': False, 'message': 'Rota não encontrada.'}, status=HTTPStatus.NOT_FOUND)


if __name__ == '__main__':
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f'Servidor em http://{HOST}:{PORT} | banco sqlite: {DB_PATH}')
    server.serve_forever()
