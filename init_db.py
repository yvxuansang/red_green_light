import sqlite3

def init_db():
    conn = sqlite3.connect('db/data.db')  # 注意数据库文件的路径
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS light_history (
            id INTEGER PRIMARY KEY,
            intersection TEXT NOT NULL,
            light_status TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
