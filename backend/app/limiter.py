from slowapi import Limiter
from slowapi.util import get_remote_address

# Global rate limiter keying by remote client IP (proxy-aware)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
