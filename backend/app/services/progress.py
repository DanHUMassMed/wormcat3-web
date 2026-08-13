import asyncio
import logging
from typing import Dict, Set, Protocol, AsyncGenerator, Optional
from app.schemas.progress_models import ProgressEvent, ProgressState

logger = logging.getLogger("wormcat3.progress")


class ProgressPublisher(Protocol):
    async def publish(self, event: ProgressEvent) -> None:
        ...

    def publish_sync(self, event: ProgressEvent) -> None:
        ...


class AsyncEventBus:
    def __init__(self) -> None:
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._latest_state: Dict[str, ProgressEvent] = {}
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def _get_loop(self) -> Optional[asyncio.AbstractEventLoop]:
        try:
            return asyncio.get_running_loop()
        except RuntimeError:
            return self._loop

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def publish(self, event: ProgressEvent) -> None:
        task_id = event.task_id
        self._latest_state[task_id] = event
        subscribers = self._subscribers.get(task_id, set())

        for queue in list(subscribers):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning("Queue full for task %s, dropping message", task_id)

    def publish_sync(self, event: ProgressEvent) -> None:
        task_id = event.task_id
        self._latest_state[task_id] = event

        loop = self._get_loop()
        if loop and loop.is_running():
            loop.call_soon_threadsafe(
                lambda e=event: asyncio.create_task(self.publish(e))
            )
        else:
            subscribers = self._subscribers.get(task_id, set())
            for queue in list(subscribers):
                try:
                    queue.put_nowait(event)
                except Exception as err:
                    logger.debug("Failed to put event synchronously: %s", err)

    async def subscribe(self, task_id: str) -> AsyncGenerator[ProgressEvent, None]:
        queue: asyncio.Queue[ProgressEvent] = asyncio.Queue(maxsize=100)
        
        if task_id not in self._subscribers:
            self._subscribers[task_id] = set()
        self._subscribers[task_id].add(queue)

        if task_id in self._latest_state:
            await queue.put(self._latest_state[task_id])

        try:
            while True:
                event = await queue.get()
                yield event
                if event.state in (ProgressState.COMPLETED, ProgressState.FAILED):
                    break
        finally:
            if task_id in self._subscribers:
                self._subscribers[task_id].discard(queue)
                if not self._subscribers[task_id]:
                    del self._subscribers[task_id]

    def get_latest_state(self, task_id: str) -> Optional[ProgressEvent]:
        return self._latest_state.get(task_id)


progress_bus = AsyncEventBus()
