"""
MongoDB Atlas integration for conversation persistence.
Optional — if not configured, the app runs without persistence.
"""

import os
import logging

from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure

logger = logging.getLogger(__name__)


class MongoDB:
    def __init__(self):
        uri = os.environ.get('MONGODB_URI')
        if not uri:
            raise ValueError('MONGODB_URI required')

        self.client = MongoClient(uri)

        # Verify connectivity
        self.client.admin.command('ping')

        db_name = os.environ.get('MONGODB_DATABASE', 'ink_ai')
        self.db = self.client[db_name]
        self.conversations = self.db['conversations']

        # Ensure index for fast listing
        self.conversations.create_index([('updatedAt', DESCENDING)])

    def save_conversation(self, conversation: dict):
        self.conversations.replace_one(
            {'id': conversation['id']},
            conversation,
            upsert=True,
        )

    def get_conversation(self, conversation_id: str) -> dict | None:
        doc = self.conversations.find_one({'id': conversation_id}, {'_id': 0})
        return doc

    def list_conversations(self) -> list[dict]:
        return list(self.conversations.find(
            {},
            {'id': 1, 'title': 1, 'accentColor': 1, 'createdAt': 1, 'updatedAt': 1, '_id': 0},
        ).sort('updatedAt', DESCENDING))

    def delete_conversation(self, conversation_id: str) -> bool:
        result = self.conversations.delete_one({'id': conversation_id})
        return result.deleted_count > 0


def init_db() -> MongoDB | None:
    """Try to initialize the database. Returns None if not configured."""
    try:
        db = MongoDB()
        logger.info('MongoDB Atlas connected')
        return db
    except Exception as e:
        logger.warning('MongoDB not available: %s — running without persistence', e)
        return None
