import sqlite3

DB_PATH = "database/bnpl.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bnpl_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount INTEGER,
            installments INTEGER,
            date TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            income INTEGER,
            rent INTEGER,
            expenses INTEGER,
            city TEXT
        )
    """)
    
    
   

    conn.commit()   
    conn.close()
    
def get_bnpl_records():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT amount, installments, date FROM bnpl_records")
    rows = cursor.fetchall()
    conn.close()

    return [
        {"amount": row[0], "installments": row[1], "date": row[2]}
        for row in rows
    ]
    
 


