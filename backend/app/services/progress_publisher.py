import json
import logging
from typing import Optional, Protocol
import redis
import redis.asyncio as aioredis

from app.core.config import settings
from app.core.redis import (
    get_async_redis_client,
    get_sync_redis_client,
    get_task_event_channel,
    get_task_state_key,
)
from app.schemas.progress_models import ProgressEvent

logger = logging.getLogger("wormcat3.services.progress_publisher")


class ProgressPublisherProtocol(Protocol):
    def publish(self, event: ProgressEvent) -> None:
        ...

    def get_state(self, task_id: str) -> Optional[ProgressEvent]:
        ...


class RedisProgressPublisher:
    """Publishes progress events to Redis Pub/Sub channels and caches task state."""

    def __init__(
        self,
        sync_client: Optional[redis.Redis] = None,
        ttl_seconds: int = settings.REDIS_STATE_TTL_SECONDS,
    ) -> None:
        self._sync_client = sync_client
        self._ttl_seconds = ttl_seconds

    @property
    def sync_client(self) -> redis.Redis:
        if self._sync_client is None:
            self._sync_client = get_sync_redis_client()
        return self._sync_client

    def publish(self, event: ProgressEvent) -> None:
        """Synchronously publish an event to Redis Pub/Sub and update cached state."""
        task_id = event.task_id
        channel = get_task_event_channel(task_id)
        state_key = get_task_state_key(task_id)
        payload = json.dumps(event.to_ws_message())

        try:
            client = self.sync_client
            # Save state in Redis with TTL
            client.set(state_key, payload, ex=self._ttl_seconds)
            # Broadcast to PubSub channel
            client.publish(channel, payload)
            logger.debug("Published progress event for task %s: %s", task_id, event.state)
        except Exception as e:
            logger.error("Failed to publish progress event for task %s: %s", task_id, e)

    def get_state(self, task_id: str) -> Optional[ProgressEvent]:
        """Synchronously retrieve latest cached state from Redis."""
        state_key = get_task_state_key(task_id)
        try:
            client = self.sync_client
            data = client.get(state_key)
            if data:
                parsed = json.loads(data)
                return ProgressEvent(**parsed)
        except Exception as e:
            logger.error("Failed to get state for task %s: %s", task_id, e)
        return None

    @staticmethod
    async def get_state_async(
        task_id: str,
        async_client: Optional[aioredis.Redis] = None,
    ) -> Optional[ProgressEvent]:
        """Asynchronously retrieve latest cached state from Redis."""
        state_key = get_task_state_key(task_id)
        client = async_client or get_async_redis_client()
        try:
            data = await client.get(state_key)
            if data:
                parsed = json.loads(data)
                return ProgressEvent(**parsed)
        except Exception as e:
            logger.error("Failed to get async state for task %s: %s", task_id, e)
        return None

    @staticmethod
    async def publish_async(
        event: ProgressEvent,
        async_client: Optional[aioredis.Redis] = None,
        ttl_seconds: int = settings.REDIS_STATE_TTL_SECONDS,
    ) -> None:
        """Asynchronously publish an event to Redis Pub/Sub and update cached state."""
        task_id = event.task_id
        channel = get_task_event_channel(task_id)
        state_key = get_task_state_key(task_id)
        payload = json.dumps(event.to_ws_message())

        client = async_client or get_async_redis_client()
        try:
            await client.set(state_key, payload, ex=ttl_seconds)
            await client.publish(channel, payload)
            logger.debug("Async published event for task %s: %s", task_id, event.state)
        except Exception as e:
            logger.error("Failed to async publish event for task %s: %s", task_id, e)


# Global publisher instance for sync Celery workers
progress_publisher = RedisProgressPublisher()
