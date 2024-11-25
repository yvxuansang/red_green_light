from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from init_db import init_db
from datetime import datetime
import sqlite3

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('change_light')
def handle_change_light(data):
    print('Received change_light event:', data)  # 调试用
    status = 'red' if data['status']['red'] else 'yellow' if data['status']['yellow'] else 'green'
    conn = sqlite3.connect('db/data.db')  # 注意数据库文件的路径
    cursor = conn.cursor()
    cursor.execute("INSERT INTO light_history (intersection, light_status, timestamp) VALUES (?, ?, ?)",
                   (data['id'], status, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    conn.close()

    emit('light_status_update', data, broadcast=True)

if __name__ == '__main__':
    init_db()
    socketio.run(app)
