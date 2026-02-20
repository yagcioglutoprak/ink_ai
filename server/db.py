"""
Azure Cosmos DB integration for conversation persistence.
Optional — if not configured, the app runs without persistence.
"""

import os
import logging

logger = logging.getLogger(__name__)


class CosmosDB:
    def __init__(self):
        from azure.cosmos import CosmosClient, PartitionKey, exceptions

        self.exceptions = exceptions

        endpoint = os.environ.get('AZURE_COSMOS_ENDPOINT')
        key = os.environ.get('AZURE_COSMOS_KEY')

        if not endpoint or not key:
            raise ValueError('AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY required')

        self.client = CosmosClient(endpoint, credential=key)

        db_name = os.environ.get('AZURE_COSMOS_DATABASE', 'ink_ai')
        container_name = os.environ.get('AZURE_COSMOS_CONTAINER', 'conversations')

        # Create database if not exists
        self.database = self.client.create_database_if_not_exists(id=db_name)

        # Create container if not exists (partition key: /id)
        self.container = self.database.create_container_if_not_exists(
            id=container_name,
            partition_key=PartitionKey(path='/id'),
        )

    def save_conversation(self, conversation: dict):
        self.container.upsert_item(conversation)

    def get_conversation(self, conversation_id: str) -> dict | None:
        try:
            return self.container.read_item(
                item=conversation_id,
                partition_key=conversation_id,
            )
        except self.exceptions.CosmosResourceNotFoundError:
            return None

    def list_conversations(self) -> list[dict]:
        return list(self.container.query_items(
            query='SELECT c.id, c.title, c.accentColor, c.createdAt, c.updatedAt FROM c ORDER BY c.updatedAt DESC',
            enable_cross_partition_query=True,
        ))

    def delete_conversation(self, conversation_id: str) -> bool:
        try:
            self.container.delete_item(
                item=conversation_id,
                partition_key=conversation_id,
            )
            return True
        except self.exceptions.CosmosResourceNotFoundError:
            return False


def init_db() -> CosmosDB | None:
    """Try to initialize the database. Returns None if not configured."""
    try:
        db = CosmosDB()
        logger.info('Azure Cosmos DB connected')
        return db
    except Exception as e:
        logger.warning('Azure Cosmos DB not available: %s — running without persistence', e)
        return None
