function floorToMinutesBucket(date, intervalMinutes = 10) {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const bucketMinutes = Math.floor(minutes / intervalMinutes) * intervalMinutes;
  d.setMinutes(bucketMinutes, 0, 0);
  return d.toISOString();
}

module.exports = { floorToMinutesBucket };
