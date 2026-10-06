from functools import wraps
from flask import request, jsonify
import jwt
from config import Config

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Assume the shared authentication service sends JWT in the Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        # Uncomment below when team's auth system is fully integrated:
        '''
        if not token:
            return jsonify({'error': 'Authentication token is missing!'}), 401
        
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            # You can inject the current_user into kwargs here
        except Exception as e:
            return jsonify({'error': 'Token is invalid!'}), 401
        '''
        
        return f(*args, **kwargs)
    return decorated
