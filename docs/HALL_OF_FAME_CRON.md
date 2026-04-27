## Hall of Fame Daily Cron

1. Set token in server env:
`HALL_OF_FAME_CRON_TOKEN=your_secret_token`

2. Add daily cron (example, 02:15 UTC):
`15 2 * * * cd /root/way-esports && HALL_OF_FAME_CRON_TOKEN=your_secret_token BASE_URL=https://wayesports.space sh scripts/update-hall-of-fame.sh >> /var/log/way-hof-cron.log 2>&1`

3. Manual check:
`curl -i -X POST https://wayesports.space/api/intelligence/hall-of-fame/cron -H "x-cron-token: your_secret_token" -H "Content-Type: application/json" -d '{}'`
