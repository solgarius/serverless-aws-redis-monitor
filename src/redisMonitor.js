const _ = require('lodash')
const redis = require('redis')
const AWS = require('aws-sdk')

async function handler () {
  try {
    const info = await getRedisINFO()
    if (info) {
      console.log('Handle Redis INFO', info)
      const cloudwatchMetric = [
        { MetricName: 'ActiveDefragHits', Unit: 'Count', Value: parseInt(info.active_defrag_hits) },
        { MetricName: 'BytesUsedForCache', Unit: 'Bytes', Value: parseInt(info.used_memory) },
        { MetricName: 'CacheHits', Unit: 'Count', Value: parseInt(info.keyspace_hits) },
        { MetricName: 'CacheMisses', Unit: 'Count', Value: parseInt(info.keyspace_misses) },
        { MetricName: 'CurrConnections', Unit: 'Count', Value: parseInt(info.connected_clients) },
        { MetricName: 'Evictions', Unit: 'Count', Value: parseInt(info.evicted_keys) },
        {
          MetricName: 'NewConnections',
          Unit: 'Count',
          Value: parseInt(info.total_connections_received)
        },
        { MetricName: 'Reclaimed', Unit: 'Count', Value: parseInt(info.expired_keys) },
        { MetricName: 'ReplicationBytes', Unit: 'Bytes', Value: parseInt(info.master_repl_offset) },
        {
          MetricName: 'SaveInProgress',
          Unit: 'Count',
          Value: parseInt(info.rdb_bgsave_in_progress)
        }
      ].filter(metric => {
        return metric.Value != null && metric.Value !== '' && !Number.isNaN(metric.Value)
      })
      await saveCloudwatchMetric(cloudwatchMetric)
    }
  } catch (e) {
    console.error('Failed to run Redis Info', e)
  }
  return null
}

function getRedisINFO () {
  return new Promise((resolve, reject) => {
    getRedisClientOptions()
      .then(opts => {
        const client = redis.createClient(opts)

        client.on('ready', function () {
          resolve(client.server_info)
        })
        client.on('error', reject)
      })
      .catch(reject)
  })
}

async function saveCloudwatchMetric (cloudwatchMetric) {
  console.log('CLOUDWATCH Metric', cloudwatchMetric)
  const Timestamp = new Date()
  const StorageResolution = 60
  const cloudwatch = new AWS.CloudWatch()
  const Dimensions = [
    { Name: 'stage', Value: process.env.API_STAGE }
  ]
  let params = {
    Namespace: `${process.env.SERVICE}/Redis`,
    MetricData: (cloudwatchMetric || []).map(metric => {
      const { MetricName, Value, Unit } = metric
      return { MetricName, Value, Unit, Timestamp, StorageResolution, Dimensions }
    })
  }
  return cloudwatch.putMetricData(params).promise()
}

async function getRedisClientOptions () {
  const host = process.env.REDIS_HOST
  let port = process.env.REDIS_PORT
  if (port && _.isString(port)) { port = parseInt(port) }

  return { host, port }
}

module.exports = { handler }
