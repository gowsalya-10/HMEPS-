import uuid
from collections import defaultdict
from copy import deepcopy
from datetime import datetime

from pymongo import MongoClient

from app.config import Config


class MemoryCollection:
    def __init__(self, name, store):
        self.name = name
        self.store = store

    def _matches(self, document, query):
        if not query:
            return True
        for key, value in query.items():
            if key == "$or":
                if any(self._matches(document, item) for item in value):
                    continue
                return False

            current = document.get(key)
            if isinstance(value, dict):
                if "$in" in value and current not in value["$in"]:
                    return False
                if "$ne" in value and current == value["$ne"]:
                    return False
                if "$exists" in value and bool(current is not None) != bool(value["$exists"]):
                    return False
            elif current != value:
                return False
        return True

    def find(self, query=None):
        documents = self.store.get(self.name, [])
        if not query:
            return [deepcopy(doc) for doc in documents]
        return [deepcopy(doc) for doc in documents if self._matches(doc, query)]

    def find_one(self, query=None):
        records = self.find(query)
        return records[0] if records else None

    def insert_one(self, document):
        record = deepcopy(document)
        record.setdefault("_id", str(uuid.uuid4()))
        self.store.setdefault(self.name, []).append(record)
        return type("InsertResult", (), {"inserted_id": record["_id"]})()

    def update_one(self, filter_query, update):
        collection = self.store.setdefault(self.name, [])
        for document in collection:
            if self._matches(document, filter_query):
                if "$set" in update:
                    for key, value in update["$set"].items():
                        document[key] = value
                if "$unset" in update:
                    for key in update["$unset"]:
                        document.pop(key, None)
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()
        return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

    def delete_one(self, filter_query):
        collection = self.store.setdefault(self.name, [])
        for index, document in enumerate(collection):
            if self._matches(document, filter_query):
                del collection[index]
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    def count_documents(self, query=None):
        return len(self.find(query))


class MemoryDatabase:
    def __init__(self):
        self.store = defaultdict(list)

    def __getitem__(self, name):
        return MemoryCollection(name, self.store)


_database = None
_memory_store = MemoryDatabase()
_mongo_connected = False


def get_db():
    global _database
    if _database is not None:
        return _database
    return _memory_store


def is_mongo_connected():
    return _mongo_connected


def initialize_database():
    global _database, _mongo_connected
    try:
        client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        _database = client[Config.MONGO_DB_NAME]
        _mongo_connected = True
    except Exception:
        _database = _memory_store
        _mongo_connected = False


def seed_demo_data():
    db = get_db()
    users = db["users"]
    if users.count_documents({}) == 0:
        import hashlib
        from werkzeug.security import generate_password_hash

        default_admin = {
            "user_id": "admin-001",
            "name": "System Administrator",
            "email": "admin@hmeps.io",
            "password_hash": generate_password_hash("admin123"),
            "role": "ADMIN",
            "department": "Administration",
            "status": "ACTIVE",
            "created_at": datetime.utcnow().isoformat(),
            "last_login": None,
        }
        users.insert_one(default_admin)

    notifications = db["notifications"]
    if notifications.count_documents({}) == 0:
        notifications.insert_one({
            "notification_id": "notif-demo-1",
            "user_id": "admin-001",
            "message": "Welcome to the HMEPS administration dashboard.",
            "severity": "info",
            "read": False,
            "created_at": datetime.utcnow().isoformat(),
        })

    audit_logs = db["audit_logs"]
    if audit_logs.count_documents({}) == 0:
        audit_logs.insert_one({
            "log_id": "log-demo-1",
            "user_id": "admin-001",
            "action": "User login",
            "module": "authentication",
            "target_id": "admin-001",
            "timestamp": datetime.utcnow().isoformat(),
            "ip_address": "127.0.0.1",
            "device_information": "system",
            "description": "Initial admin account seeded for Module 3.",
        })
