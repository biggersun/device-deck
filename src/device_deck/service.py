from datetime import datetime, timezone
import time

from . import adapters
from .store import Store, now


class Hub:
    def __init__(self, home=None):
        self.store = Store(home)

    def connection(self, device_id, endpoint_id):
        device = self.store.get_device(device_id)
        endpoint = next((e for e in device.endpoints if e.id == endpoint_id), None)
        if not endpoint:
            raise KeyError("Endpoint not found on this device")
        return device, endpoint, self.store.get_credential(endpoint.credential_id)

    def plan(self, device_id, endpoint_id):
        _, endpoint, credential = self.connection(device_id, endpoint_id)
        return {"device_id": device_id, "endpoint_id": endpoint_id, **adapters.plan(endpoint, credential)}

    def probe(self, device_id, endpoint_id, actor="cli"):
        device, endpoint, credential = self.connection(device_id, endpoint_id)
        result = {"device_id": device_id, "endpoint_id": endpoint_id, "checked_at": now(),
                  "reachable": False, "identity_verified": False, "metrics": None}
        started = time.monotonic()
        try:
            metrics, verified = adapters.ADAPTERS[endpoint.protocol](device, endpoint, credential)
            result.update(status="verified" if verified else "reachable_unverified", reachable=True,
                          identity_verified=verified, metrics=metrics)
        except adapters.ProbeFailure as error:
            result.update(status=error.status, detail=error.detail)
        result["elapsed_ms"] = round((time.monotonic()-started)*1000)
        self.store.save_observation(result, actor)
        return result
