import asyncio
import pytest
from app.schemas.progress_models import ProgressEvent, ProgressState
from app.services.progress import AsyncEventBus


@pytest.mark.asyncio
async def test_event_bus_publish_subscribe():
    bus = AsyncEventBus()
    task_id = "test-task-123"

    received_events = []

    async def subscriber_task():
        async for event in bus.subscribe(task_id):
            received_events.append(event)

    sub_task = asyncio.create_task(subscriber_task())
    await asyncio.sleep(0.01)

    event1 = ProgressEvent(
        task_id=task_id,
        state=ProgressState.PROGRESS,
        progress=50,
        message="Halfway done",
    )
    event2 = ProgressEvent(
        task_id=task_id,
        state=ProgressState.COMPLETED,
        progress=100,
        message="Done",
        result_url="output.zip",
    )

    await bus.publish(event1)
    await bus.publish(event2)

    await asyncio.wait_for(sub_task, timeout=2.0)

    assert len(received_events) == 2
    assert received_events[0].state == ProgressState.PROGRESS
    assert received_events[1].state == ProgressState.COMPLETED
    assert received_events[1].result_url == "output.zip"
