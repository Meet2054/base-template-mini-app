import { Alchemy, Network } from 'alchemy-sdk'
import { PrismaClient } from '@prisma/client'
import CoinGecko from 'coingecko-api-v3'
import { Configuration, OpenAIApi } from 'openai'
import { Telegraf } from 'telegraf'

const prisma = new PrismaClient()
const coingecko = new CoinGecko()
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
})

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
)

export async function monitorWallets() {
  const users = await prisma.user.findMany({
    include: {
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  for (const user of users) {
    try {
      // Get current wallet data
      const balances = await alchemy.core.getTokenBalances(user.walletAddress)
      
      // Get token prices and calculate total value
      let totalValue = 0
      const tokenDetails = await Promise.all(
        balances.tokenBalances.map(async (token) => {
          try {
            const price = await coingecko.simplePrice({
              ids: [token.contractAddress],
              vs_currencies: ['usd'],
            })
            const value = (Number(token.tokenBalance) / 1e18) * price[token.contractAddress].usd
            totalValue += value
            return { ...token, usdValue: value }
          } catch (error) {
            console.error(`Error fetching price for token ${token.contractAddress}:`, error)
            return { ...token, usdValue: 0 }
          }
        })
      )

      // Create new snapshot
      const snapshot = await prisma.watchSnapshot.create({
        data: {
          userId: user.id,
          balances: tokenDetails,
          totalValue,
        },
      })

      // Generate and send summary if significant changes
      if (user.snapshots[0]) {
        const previousValue = user.snapshots[0].totalValue
        const percentChange = ((totalValue - previousValue) / previousValue) * 100

        if (Math.abs(percentChange) >= 5) {
          const summary = await generateAISummary({
            currentSnapshot: snapshot,
            previousSnapshot: user.snapshots[0],
            percentChange,
          })

          await sendTelegramUpdate(user.telegramId, summary)
        }
      }
    } catch (error) {
      console.error(`Error monitoring wallet for user ${user.id}:`, error)
    }
  }
}

async function generateAISummary({
  currentSnapshot,
  previousSnapshot,
  percentChange,
}) {
  const prompt = `You are "Satoshi," a witty, wise crypto guardian.
Write a short Telegram message summarizing the following portfolio changes:
- Overall portfolio ${percentChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange.toFixed(2))}%
- Current total value: $${currentSnapshot.totalValue.toFixed(2)}
- Previous value: $${previousSnapshot.totalValue.toFixed(2)}

Write in a friendly tone, under 150 words, including one piece of "Satoshi Wisdom" related to the market conditions.`

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  })

  return response.data.choices[0].message?.content || 'Unable to generate summary'
}

async function sendTelegramUpdate(telegramId: string, message: string) {
  try {
    await bot.telegram.sendMessage(telegramId, message)
  } catch (error) {
    console.error(`Error sending Telegram message to ${telegramId}:`, error)
  }
}