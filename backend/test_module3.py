from app import create_app

app = create_app()

with app.test_client() as client:
    health = client.get('/api/health')
    print('HEALTH', health.status_code, health.get_json())

    login = client.post('/api/auth/login', json={'email': 'admin@hmeps.io', 'password': 'admin123'})
    print('LOGIN', login.status_code, login.get_json())

    token = login.get_json().get('token')
    me = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    print('ME', me.status_code, me.get_json())

    users = client.get('/api/users', headers={'Authorization': f'Bearer {token}'})
    print('USERS', users.status_code, users.get_json())
