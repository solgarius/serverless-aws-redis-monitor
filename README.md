# serverless-aws-redis-monitor
A tool using the serverless framework to monitor a redis instance & posting to cloudwatch.
This reports similar metrics as elasticache allowing the instance to be monitored in the same 
way.

The metrics reported are:
* ActiveDefragHits
* BytesUsedForCache
* CacheHits
* CacheMisses
* CurrConnections
* Evictions
* NewConnections
* Reclaimed'
* ReplicationBytes
* SaveInProgress
