"""
Dynaconf settings, read from the environment (and secrets/.env in dev)
"""

from dynaconf import Dynaconf, Validator

settings = Dynaconf(
    envvar_prefix=False,
    load_dotenv=True,
    validators=[
        Validator("root_path", default=""),
        Validator(
            "contributions_repo", default="EPFL-ENAC/eesd-modern-masonry-walls-db"
        ),
        Validator("contributions_base", default="dev"),
        Validator("contributions_reviewers", default=""),  # comma-separated logins
        Validator("contributions_max_open", default=25, cast=int),
        Validator("github_app_id", default=None),
        Validator("github_app_private_key", default=None),
        Validator("github_app_installation_id", default=None),
        Validator("github_token", default=None),
    ],
)
