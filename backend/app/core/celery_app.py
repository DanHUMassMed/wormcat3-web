import logging
from celery import Celery
from app.core.config import settings

logger = logging.getLogger("wormcat3.core.celery")

celery_app = Celery(
    "wormcat3",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.celery_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=settings.REDIS_STATE_TTL_SECONDS,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_track_started=True,
    timezone="UTC",
    enable_utc=True,
)
