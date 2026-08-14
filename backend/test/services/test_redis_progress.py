import json
from unittest.mock import MagicMock

from app.schemas.progress_models import ProgressEvent, ProgressState
from app.services.progress_publisher import RedisProgressPublisher


def test_progress_event_serialization():
    event = ProgressEvent(
        task_id="task-abc-123",
        state=ProgressState.PROGRESS,
        progress=45,
        message="Processing Sheet 1",
        report_id="task-abc-123",
        download_url="/dynamic/wormcat_out/task-abc-123.zip",
    )
    ws_dict = event.to_ws_message()
    assert ws_dict["task_id"] == "task-abc-123"
    assert ws_dict["state"] == "PROGRESS"
    assert ws_dict["progress"] == 45
    assert ws_dict["message"] == "Processing Sheet 1"
    assert ws_dict["report_id"] == "task-abc-123"
    assert ws_dict["download_url"] == "/dynamic/wormcat_out/task-abc-123.zip"


def test_redis_progress_publisher_sync_publish():
    mock_redis = MagicMock()
    publisher = RedisProgressPublisher(sync_client=mock_redis, ttl_seconds=3600)

    event = ProgressEvent(
        task_id="test-task-1",
        state=ProgressState.COMPLETED,
        progress=100,
        message="Done",
        result_url="out.zip",
    )

    publisher.publish(event)

    assert mock_redis.set.called
    assert mock_redis.publish.called

    set_args = mock_redis.set.call_args
    assert set_args[0][0] == "wormcat:state:test-task-1"
    assert json.loads(set_args[0][1])["state"] == "COMPLETED"
    assert set_args[1]["ex"] == 3600

    pub_args = mock_redis.publish.call_args
    assert pub_args[0][0] == "wormcat:events:test-task-1"
    assert json.loads(pub_args[0][1])["state"] == "COMPLETED"


def test_redis_progress_publisher_get_state():
    mock_redis = MagicMock()
    stored_event = ProgressEvent(
        task_id="test-task-2",
        state=ProgressState.PROGRESS,
        progress=50,
        message="Halfway",
    )
    mock_redis.get.return_value = json.dumps(stored_event.to_ws_message())

    publisher = RedisProgressPublisher(sync_client=mock_redis)
    state = publisher.get_state("test-task-2")

    assert state is not None
    assert state.task_id == "test-task-2"
    assert state.state == ProgressState.PROGRESS
    assert state.progress == 50
