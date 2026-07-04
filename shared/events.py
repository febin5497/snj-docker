import os
import json
import redis
from datetime import datetime


redis_client = None


def init_event_bus():
    global redis_client
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    redis_client = redis.from_url(redis_url, decode_responses=True)
    return redis_client


def publish_event(channel, event_data):
    if not redis_client:
        init_event_bus()
    event = {
        "channel": channel,
        "data": event_data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    redis_client.publish(channel, json.dumps(event))
    return event


def subscribe_event(channel, callback):
    if not redis_client:
        init_event_bus()
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel)
    for message in pubsub.listen():
        if message["type"] == "message":
            data = json.loads(message["data"])
            callback(data)
