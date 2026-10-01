"""
Dynaconf settings, read from the environment (and secrets/.env in dev)
"""

from dynaconf import Dynaconf, Validator

settings = Dynaconf(
    envvar_prefix=False,
    load_dotenv=True,
    validators=[
        Validator("root_path", default=""),
    ],
)
