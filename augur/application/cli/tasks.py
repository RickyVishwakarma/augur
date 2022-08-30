#SPDX-License-Identifier: MIT

"""
Augur library commands for controlling the backend components
"""

import os
import click
import subprocess
import uuid
import time
# from redis.exceptions import ConnectionError as RedisConnectionError

from augur import instance_id
from augur.application.logs import AugurLogger
from augur.tasks.init.redis_connection import redis_connection
from augur.application.cli import test_connection, test_db_connection 
from augur.application.cli.backend import clear_redis_caches

logger = AugurLogger("augur", reset_logfiles=True).get_logger()

@click.group('celery', short_help='Commands for controlling the backend API server & data collection workers')
def cli():
    """Placeholder docstring."""

@cli.command("start")
@test_connection
@test_db_connection
def start():
    """Start Augur's celery process."""
    default_worker = None
    cpu_worker = None

    default_worker = f"celery -A augur.tasks.init.celery_app.celery_app worker -P eventlet -l info --concurrency=1000 -n {instance_id}@%h"
    cpu_worker = f"celery -A augur.tasks.init.celery_app.celery_app worker -l info --concurrency=20 -n {uuid.uuid4().hex}@%h -Q cpu"
    default_worker_process = subprocess.Popen(default_worker.split(" "))
    cpu_worker_process = subprocess.Popen(cpu_worker.split(" "))
    time.sleep(5)

    try:
        default_worker_process.wait()
    except KeyboardInterrupt:

        if default_worker_process or cpu_worker_process:
            logger.info("Shutting down celery process")

        if default_worker_process:
            default_worker_process.terminate()

        if cpu_worker_process:
            cpu_worker_process.terminate()

        try:
            clear_redis_caches()
            
        except Exception as e:
            pass

@cli.command("clear-tasks")
@test_connection
@test_db_connection
def clear():


    while True:

        user_input = str(input("Warning this will remove all the tasks from all instances on this server!\nWould you like to proceed? [y/N]"))

        if not user_input:
            logger.info("Exiting")
            return
        
        if user_input in ("y", "Y", "Yes", "yes"):
            logger.info("Removing all tasks")
            celery_purge_command = "celery -A augur.tasks.init.celery_app.celery_app purge -f"
            subprocess.call(celery_purge_command.split(" "))
            return

        elif user_input in ("n", "N", "no", "NO"):
            logger.info("Exiting")
            return
        else:
            logger.error("Invalid input")

    