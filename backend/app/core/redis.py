import logging
from typing import Optional
import redis
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("wormcat3.core.redis")

_async_redis_pool: Optional[aioredis.ConnectionPool] = None


def get_task_event_channel(task_id: str) -> str:
    return f"wormcat:events:{task_id}"


def get_task_state_key(task_id: str) -> str:
    return f"wormcat:state:{task_id}"


def get_async_redis_pool() -> aioredis.ConnectionPool:
    global _async_redis_pool
    if _async_redis_pool is None:
        _async_redis_pool = aioredis.ConnectionPool.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=50,
        )
    return _async_redis_pool


def get_async_redis_client() -> aioredis.Redis:
    pool = get_async_redis_pool()
    return aioredis.Redis(connection_pool=pool)


async def close_async_redis_pool() -> None:
    global _async_redis_pool
    if _async_redis_pool is not None:
        logger.info("Closing async Redis connection pool...")
        await _async_redis_pool.disconnect()
        _async_redis_pool = None


def get_sync_redis_client() -> redis.Redis:
    return redis.Redis.from_url(
        settings.redis_url,
        decode_responses=True,
    )
