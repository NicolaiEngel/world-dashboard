"""One shared HTTP session: descriptive User-Agent, timeouts and a couple of retries."""
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

USER_AGENT = "world-dashboard/0.1 (non-commercial dashboard; https://github.com/NicolaiEngel/world-dashboard)"
TIMEOUT = 20  # seconds


class SourceError(Exception):
    """A source could not deliver usable data for an indicator."""


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = USER_AGENT
    retry = Retry(total=2, backoff_factor=1.5, status_forcelist=(429, 500, 502, 503, 504),
                  allowed_methods=("GET",))
    s.mount("https://", HTTPAdapter(max_retries=retry))
    return s


def get(session: requests.Session, url: str, **params) -> requests.Response:
    try:
        r = session.get(url, params=params or None, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise SourceError(f"request failed: {e.__class__.__name__}") from e
    if r.status_code != 200:
        raise SourceError(f"HTTP {r.status_code} from {r.url}")
    return r
