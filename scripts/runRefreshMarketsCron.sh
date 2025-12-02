#!/bin/bash
# 크론 작업용 래퍼 스크립트
# 10분 간격으로 실행

cd /home/runner/workspace
npm run refresh:markets >> /tmp/refresh-markets-cron.log 2>&1
