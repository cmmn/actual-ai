'use client'

import { YStack, XStack, Text, Accordion } from 'tamagui'

interface MetricsData {
  cost: number | null
  timeToFirstToken: number | null
  totalTime: number | null
  tokenCount: number | null
}

interface MetricsProps {
  metrics: MetricsData
  model: string
  isHostedOnHF?: boolean
  hourlyCost?: number
}

export function Metrics({ metrics, isHostedOnHF = false, hourlyCost = 0 }: MetricsProps) {
  const formatTime = (ms: number | null) => {
    if (ms === null) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatCost = (cost: number | null) => {
    if (cost === null) return '-'
    const costFor1000 = cost * 1000
    return `$${costFor1000.toFixed(2)}`
  }

  const estimateMonthlyHours = (requestCount: number) => {
    // Estimate realistic hosting hours based on request distribution
    // Assumes business hour usage with 1-hour auto-scaling timeout
    const dailyRequests = requestCount / 30

    if (dailyRequests <= 5) {
      // Low usage: ~2-3 active periods per day = 15-20 hours/month
      return Math.max(15, requestCount * 0.015)
    } else if (dailyRequests <= 50) {
      // Medium usage: ~4-6 hours active per day = 30-50 hours/month
      return Math.max(25, requestCount * 0.0035)
    } else if (dailyRequests <= 200) {
      // High usage: ~6-8 hours active per day = 60-80 hours/month
      return Math.max(50, requestCount * 0.0008)
    } else if (requestCount >= 10000000) {
      // 10M+ requests: requires 10-20 instances, ~2500 hours for high volume
      return 2500
    } else {
      // Very high usage: approaching always-on during business hours
      return Math.min(200, 80 + requestCount * 0.0003)
    }
  }

  const calculateMonthlyCosts = (perRequestCost: number, requestCount: number) => {
    const tokenCost = perRequestCost * requestCount

    if (isHostedOnHF) {
      const estimatedHours = estimateMonthlyHours(requestCount)
      const hostingCost = estimatedHours * hourlyCost

      return {
        cost: tokenCost + hostingCost,
        hours: estimatedHours,
        hasHosting: true
      }
    } else {
      // Non-HF models: only transaction costs
      return {
        cost: tokenCost,
        hours: 0,
        hasHosting: false
      }
    }
  }

  const calculatePerformanceMetrics = () => {
    if (metrics.timeToFirstToken && metrics.totalTime && metrics.tokenCount) {
      const streamingTime = metrics.totalTime - metrics.timeToFirstToken
      const tokensPerSecond = streamingTime > 0 ? (metrics.tokenCount / (streamingTime / 1000)).toFixed(1) : '-'
      const avgLatency = metrics.totalTime / metrics.tokenCount || 0

      return {
        tokensPerSecond,
        streamingTime,
        avgLatency: avgLatency.toFixed(1)
      }
    }
    return { tokensPerSecond: '-', streamingTime: null, avgLatency: '-' }
  }

  const performanceMetrics = calculatePerformanceMetrics()

  return (
    <YStack gap="$2" p="$3" bg="$background025" br="$4" w={400}>
      {/* Performance Metrics Accordion */}
      {metrics.timeToFirstToken && metrics.totalTime && metrics.tokenCount && (
        <Accordion type="single" defaultValue="performance-metrics" collapsible>
          <Accordion.Item value="performance-metrics">
            <Accordion.Trigger flexDirection="row" justifyContent="space-between">
              {({ open }: { open: boolean }) => (
                <>
                  <Text color="$color12" fontSize="$2">Performance Details</Text>
                  <Text color="$color12" fontSize="$2" transform={[{ rotate: open ? '180deg' : '0deg' }]}>
                    ▼
                  </Text>
                </>
              )}
            </Accordion.Trigger>
            <Accordion.Content>
              <YStack gap="$2" pt="$2">
                {/* Results Summary (matching main accordion style) */}
                <XStack jc="space-between" ai="center">
                  <Text color="$color075" fontSize="$2">First Token:</Text>
                  <Text color="$color" fontSize="$2" fontWeight="500">
                    {formatTime(metrics.timeToFirstToken)}
                  </Text>
                </XStack>

                <XStack jc="space-between" ai="center">
                  <Text color="$color075" fontSize="$2">Total Time:</Text>
                  <Text color="$color" fontSize="$2" fontWeight="500">
                    {formatTime(metrics.totalTime)}
                  </Text>
                </XStack>

                <XStack jc="space-between" ai="center">
                  <Text color="$color075" fontSize="$2">Tokens:</Text>
                  <Text color="$color" fontSize="$2" fontWeight="500">
                    {metrics.tokenCount ?? '-'}
                  </Text>
                </XStack>

                <XStack jc="space-between" ai="center">
                  <Text color="$color075" fontSize="$2">Cost (1K requests):</Text>
                  <Text color="$color" fontSize="$2" fontWeight="500">
                    {formatCost(metrics.cost)}
                  </Text>
                </XStack>

                {/* Core Performance Metrics */}
                <XStack jc="space-between" ai="center">
                  <Text color="$color075" fontSize="$2">Tokens/second:</Text>
                  <Text color="$color" fontSize="$2" fontWeight="500">
                    {performanceMetrics.tokensPerSecond}
                  </Text>
                </XStack>

                <XStack jc="space-between" ai="center">
                  <Text color="$color075" fontSize="$2">Streaming time:</Text>
                  <Text color="$color" fontSize="$2" fontWeight="500">
                    {performanceMetrics.streamingTime ? formatTime(performanceMetrics.streamingTime) : '-'}
                  </Text>
                </XStack>

                <XStack jc="space-between" ai="center">
                  <Text color="$color075" fontSize="$2">Avg latency/token:</Text>
                  <Text color="$color" fontSize="$2" fontWeight="500">
                    {performanceMetrics.avgLatency}ms
                  </Text>
                </XStack>


              </YStack>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      )}

      {/* Cost projections for all models */}
      {metrics.cost !== null && (
        <Accordion type="single" collapsible>
          <Accordion.Item value="cost-projections">
            <Accordion.Trigger flexDirection="row" justifyContent="space-between">
              {({ open }: { open: boolean }) => (
                <>
                  <Text color="$color12" fontSize="$2">Cost Projections</Text>
                  <Text color="$color12" fontSize="$2" transform={[{ rotate: open ? '180deg' : '0deg' }]}>
                    ▼
                  </Text>
                </>
              )}
            </Accordion.Trigger>
            <Accordion.Content>
              <YStack gap="$2" pt="$2">
                {[10000, 1000000, 10000000].map(requestCount => {
                  const costs = calculateMonthlyCosts(metrics.cost!, requestCount)
                  return (
                    <YStack key={requestCount} gap="$1">
                      <Text color="$color" fontSize="$2" fontWeight="500">
                        {requestCount.toLocaleString()} requests/month:
                      </Text>
                      {costs.hasHosting ? (
                        // HF models with hosting costs
                        <>
                          <XStack jc="space-between" pl="$2">
                            <Text color="$color" fontSize="$1">Est. cost:</Text>
                            <Text color="$color" fontSize="$1">${costs.cost.toLocaleString()}</Text>
                          </XStack>
                          <XStack jc="space-between" pl="$2">
                            <Text color="$color075" fontSize="$1">Est. hosting hours:</Text>
                            <Text color="$color075" fontSize="$1">{costs.hours.toFixed(0)}h</Text>
                          </XStack>
                        </>
                      ) : (
                        // Non-HF models with only transaction costs
                        <XStack jc="space-between" pl="$2">
                          <Text color="$color075" fontSize="$1">Transaction cost:</Text>
                          <Text color="$color" fontSize="$1">${costs.cost >= 1000 ? costs.cost.toLocaleString() : costs.cost.toFixed(2)}</Text>
                        </XStack>
                      )}
                    </YStack>
                  )
                })}

                {/* Add notes for HF models */}
                {isHostedOnHF && (
                  <YStack gap="$1" pt="$3" borderTopWidth="$0.5" borderTopColor="$borderColor">
                    <Text color="$blue10" fontSize="$1" fontStyle="italic" fontWeight="500">
                      * Max: ${(720 * hourlyCost).toFixed(0)}/month for 24/7 availability (720 hours)
                    </Text>
                    <Text color="$blue10" fontSize="$1" fontStyle="italic" fontWeight="500">
                      * Cold start time: ~60-120 seconds when scaling from zero
                    </Text>
                  </YStack>
                )}
              </YStack>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      )}
    </YStack>
  )
}