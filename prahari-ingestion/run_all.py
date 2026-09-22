"""
Project Prahari — Unified Data Ingestion Orchestrator

Runs all data ingestion pollers (AQICN, USGS, CWC) concurrently using
threading. Each poller runs on its own schedule:

  - AQICN (Air Quality): Every 30 minutes
  - USGS (Earthquakes):  Every 5 minutes
  - CWC  (River Levels): Every 15 minutes
  - LHASA (Landslides):  Every 6 hours (stub)

Usage:
  python run_all.py             # Run all pollers
  python run_all.py --only aqicn  # Run a specific poller
  python run_all.py --once        # Run all pollers once (no scheduling)
"""

import argparse
import logging
import threading
import time
import sys

from db import test_connection

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('Orchestrator')


def run_poller_thread(name, poll_fn, interval_minutes):
    """Run a polling function on a schedule in a separate thread."""
    import schedule

    logger.info(f"Starting {name} poller (every {interval_minutes} min)")

    # Run once immediately
    try:
        poll_fn()
    except Exception as e:
        logger.error(f"{name} initial poll failed: {e}")

    # Schedule recurring
    if interval_minutes >= 60:
        schedule.every(interval_minutes // 60).hours.do(poll_fn)
    else:
        schedule.every(interval_minutes).minutes.do(poll_fn)

    while True:
        schedule.run_pending()
        time.sleep(1)


def main():
    parser = argparse.ArgumentParser(description='Prahari Data Ingestion Orchestrator')
    parser.add_argument('--only', choices=['aqicn', 'usgs', 'cwc', 'lhasa'],
                        help='Run only a specific poller')
    parser.add_argument('--once', action='store_true',
                        help='Run all pollers once without scheduling')
    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("🛡️  Project Prahari — Data Ingestion Orchestrator")
    logger.info("=" * 60)

    # Test database connection first
    if not test_connection():
        logger.error("❌ Cannot connect to PostgreSQL. Check your .env config.")
        logger.error("   Required: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB,")
        logger.error("             POSTGRES_USER, POSTGRES_PASSWORD")
        sys.exit(1)

    # Import pollers
    from aqicn_poller import poll_aqicn
    from usgs_poller import poll_usgs
    from cwc_scraper import poll_river_levels
    from lhasa_processor import process_lhasa_nowcast

    pollers = {
        'aqicn': ('AQICN Air Quality', poll_aqicn, 30),
        'usgs':  ('USGS Earthquakes', poll_usgs, 5),
        'cwc':   ('CWC River Levels', poll_river_levels, 15),
        'lhasa': ('NASA LHASA Landslides', process_lhasa_nowcast, 360),
    }

    if args.once:
        logger.info("Running all pollers once (--once mode)...")
        for key, (name, poll_fn, _) in pollers.items():
            if args.only and args.only != key:
                continue
            logger.info(f"\n--- {name} ---")
            try:
                poll_fn()
            except Exception as e:
                logger.error(f"{name} failed: {e}")
        logger.info("Done. Exiting.")
        return

    # Determine which pollers to run
    if args.only:
        to_run = {args.only: pollers[args.only]}
    else:
        to_run = pollers

    # Start each poller in a daemon thread
    threads = []
    for key, (name, poll_fn, interval) in to_run.items():
        t = threading.Thread(
            target=run_poller_thread,
            args=(name, poll_fn, interval),
            daemon=True,
            name=f"poller-{key}"
        )
        t.start()
        threads.append(t)
        logger.info(f"  ✅ {name} thread started")

    logger.info(f"\n🚀 {len(threads)} poller(s) running. Press Ctrl+C to stop.\n")

    # Keep main thread alive
    try:
        while True:
            time.sleep(60)
            # Log a heartbeat every minute
            alive = sum(1 for t in threads if t.is_alive())
            logger.debug(f"Heartbeat: {alive}/{len(threads)} pollers alive")
    except KeyboardInterrupt:
        logger.info("\n🛑 Shutting down pollers...")
        sys.exit(0)


if __name__ == "__main__":
    main()
