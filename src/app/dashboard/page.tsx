"use client"
import { Card } from '~/components/ui/Card'
import { Button } from '~/components/ui/Button'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface TokenBalance {
  token: string
  symbol: string
  balance: string
  value: number
  change: number
  decimals: number
  logo: string | null
}

interface PortfolioData {
  totalValue: number
  dailyChange: number
  tokens: TokenBalance[]
  aiSummary: string
  lastUpdated: string
}

export default function DashboardPage() {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPortfolioData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchPortfolioData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchPortfolioData() {
    try {
      setError(null)
      const response = await fetch('/api/portfolio')
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data')
      }
      const responseData = await response.json()
      if (responseData.error) {
        throw new Error(responseData.error)
      }
      setData(responseData)
    } catch (error) {
      console.error('Error fetching portfolio data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load portfolio data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          Your Crypto Portfolio
        </h1>
        <p className="text-gray-400 mt-2">
          Last updated: {data?.lastUpdated || 'Never'}
        </p>
      </div>

      {error ? (
        <Card className="bg-slate-900 border-slate-800 p-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => {
            setLoading(true)
            fetchPortfolioData()
          }}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          {/* Portfolio Overview Card */}
          <Card className="bg-slate-900 border-slate-800 p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400">Total Value</p>
                {loading ? (
                  <div className="h-8 bg-slate-800 rounded animate-pulse" />
                ) : (
                  <h2 className="text-2xl font-bold">
                    ${(data?.totalValue || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h2>
                )}
              </div>
              <div>
                <p className="text-gray-400">24h Change</p>
                {loading ? (
                  <div className="h-8 bg-slate-800 rounded animate-pulse" />
                ) : (
                  <h2 className={`text-2xl font-bold ${
                    (data?.dailyChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {(data?.dailyChange || 0) > 0 ? '+' : ''}
                    {(data?.dailyChange || 0).toFixed(2)}%
                  </h2>
                )}
              </div>
              <div>
                <p className="text-gray-400">Unique Tokens</p>
                {loading ? (
                  <div className="h-8 bg-slate-800 rounded animate-pulse" />
                ) : (
                  <h2 className="text-2xl font-bold">{data?.tokens?.length || 0}</h2>
                )}
              </div>
            </div>
          </Card>

          {/* AI Insights Card */}
          <Card className="bg-slate-900 border-slate-800 p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Satoshi&apos;s Insights 🤖</h3>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-2/3" />
              </div>
            ) : (
              <p className="text-gray-300">{data?.aiSummary || 'No insights available yet.'}</p>
            )}
          </Card>

          {/* Token List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Assets</h3>
            {loading ? (
              // Loading skeleton for tokens
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="bg-slate-900 border-slate-800 p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                      <div>
                        <div className="h-4 bg-slate-800 rounded animate-pulse w-24 mb-1" />
                        <div className="h-3 bg-slate-800 rounded animate-pulse w-16" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-20 mb-1" />
                      <div className="h-3 bg-slate-800 rounded animate-pulse w-12" />
                    </div>
                  </div>
                </Card>
              ))
            ) : !data?.tokens?.length ? (
              <Card className="bg-slate-900 border-slate-800 p-6 text-center">
                <p className="text-gray-400">No tokens found in this wallet</p>
              </Card>
            ) : (
              data.tokens.map((token, index) => (
                <Card key={index} className="bg-slate-900 border-slate-800 p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Image 
                        src={token.logo || `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/128/color/${token.symbol.toLowerCase()}.png`}
                        alt={token.symbol}
                        width={32}
                        height={32}
                        className="rounded-full bg-slate-800"
                        onError={(e) => {
                          // Fallback to a default image if both logo and cryptocurrency-icons fail
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMWYyOTM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM0YjU1NjMiIGZvbnQtc2l6ZT0iMTQiPj8/PC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {token.token}
                          <span className="text-sm text-gray-400">{token.symbol}</span>
                        </h4>
                        <p className="text-sm text-gray-400">
                          {token.balance} {token.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${token.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</p>
                      <p className={`text-sm ${
                        token.change >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {token.change > 0 ? '+' : ''}{token.change.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Button
            onClick={fetchPortfolioData}
            className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500"
          >
            Refresh Data
          </Button>
        </>
      )}
    </div>
  )
}