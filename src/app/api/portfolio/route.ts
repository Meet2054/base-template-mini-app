import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { Alchemy, Network } from 'alchemy-sdk'
import CoinGecko from 'coingecko-api-v3'
import OpenAI from 'openai'

interface AlchemyTokenBalance {
  contractAddress: string
  tokenBalance: string
}

interface TokenBalance {
  token: string
  symbol: string
  balance: string
  value: number
  change: number
  decimals: number
  logo: string | null
}

interface AlchemyResponse {
  tokenBalances: AlchemyTokenBalance[]
}

const prisma = new PrismaClient()
const coingecko = CoinGecko

// Check if required environment variables are available
if (!process.env.ALCHEMY_API_KEY) {
  throw new Error('ALCHEMY_API_KEY is not configured');
}

// Initialize direct API fetching
async function fetchAlchemyApi(method: string, params: any[]) {
  const response = await fetch('https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      id: Date.now(),
      jsonrpc: '2.0',
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.result;
}

// Initialize Alchemy as backup
let alchemy: Alchemy;
try {
  const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
    maxRetries: 3
  };
  alchemy = new Alchemy(config);
} catch (error) {
  console.error('Failed to initialize Alchemy SDK (will use direct API):', error);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  console.log('Starting portfolio data fetch...');
  try {
    // For demo, use a default wallet address
    const defaultWalletAddress = process.env.DEFAULT_WALLET_ADDRESS || '0xFd5a05A2cBD51d50F5B4C36B475e454D6B4bdF09'
    
    let user;
    try {
      // Try to find existing user
      user = await prisma.user.findFirst({
        where: { walletAddress: defaultWalletAddress },
        include: {
          snapshots: {
            orderBy: { createdAt: 'desc' },
            take: 2,
          },
        },
      })

      // If no user exists, create one
      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress: defaultWalletAddress,
            telegramId: 'demo',
          },
          include: {
            snapshots: {
              orderBy: { createdAt: 'desc' },
              take: 2,
            },
          },
        })
      }
    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get current wallet data with retry logic
    let balances;
    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Attempting to fetch wallet balances (attempt ${i + 1}/${maxRetries})...`);
        
        balances = await fetchAlchemyApi('alchemy_getTokenBalances', [user.walletAddress, 'erc20']);
        console.log('Fetched balances:', balances);
        break;
      } catch (error) {
        console.error(`Alchemy API error (attempt ${i + 1}/${maxRetries}):`, error);
        if (i === maxRetries - 1) {
          return NextResponse.json(
            { error: 'Failed to fetch wallet data after multiple attempts' },
            { status: 500 }
          );
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }

    if (!balances || !balances.tokenBalances) {
      return NextResponse.json(
        { error: 'No token data available' },
        { status: 404 }
      );
    }

    // Get token metadata and prices
    let totalValue = 0;
    
    // Limit to top 10 tokens by balance for demo
    const filteredBalances = (balances as AlchemyResponse).tokenBalances
      .filter((token: AlchemyTokenBalance) => token.tokenBalance !== "0")
      .slice(0, 10);
    
    const tokenDetails = await Promise.all(
      filteredBalances.map(async (token: AlchemyTokenBalance) => {
        try {
          // Get token metadata with retry logic
          let metadata;
          try {
            // Try direct API call for metadata
            metadata = await fetchAlchemyApi('alchemy_getTokenMetadata', [token.contractAddress]);
            console.log('Fetched metadata for', token.contractAddress, ':', metadata);
          } catch (error) {
            console.error(`Failed to get metadata for ${token.contractAddress}:`, error);
            // Use minimal metadata if fetch fails
            metadata = { decimals: 18, symbol: '???', name: token.contractAddress };
          }
          
          // Add delay between CoinGecko API calls
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${token.contractAddress}&vs_currencies=usd`,
            {
              headers: {
                'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || '',
                'Accept': 'application/json',
              },
              next: { revalidate: 300 }, // Cache for 5 minutes
            }
          );

          if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
          }

          const price = await response.json();
          const tokenPrice = price[token.contractAddress]?.usd || 0;
          const balance = Number(token.tokenBalance) / Math.pow(10, metadata.decimals || 18);
          const value = balance * tokenPrice;
          totalValue += value;

          return {
            token: metadata.name || token.contractAddress,
            symbol: metadata.symbol || '???',
            balance: balance.toFixed(4),
            value,
            change: 0,
            decimals: metadata.decimals || 18,
            logo: metadata.logo || null,
          };
        } catch (error) {
          console.error(`Error processing token ${token.contractAddress}:`, error);
          return {
            token: token.contractAddress,
            symbol: '???',
            balance: (Number(token.tokenBalance) / 1e18).toFixed(4),
            value: 0,
            change: 0,
            decimals: 18,
            logo: null,
          };
        }
      })
    )

    // Calculate daily change
    let dailyChange = 0
    if (user.snapshots[1]) {
      const previousValue = user.snapshots[1].totalValue
      dailyChange = ((totalValue - previousValue) / previousValue) * 100
    }

    // Generate AI summary
    let aiSummary = ''
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `You are "Satoshi," a witty, wise crypto guardian.
Write a short message summarizing the following portfolio changes:
- Overall portfolio ${dailyChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(dailyChange)}%
- Current total value: $${totalValue.toFixed(2)}
- Previous value: $${user.snapshots[1]?.totalValue.toFixed(2) || 'N/A'}

Write in a friendly tone, under 150 words, including one piece of "Satoshi Wisdom" related to the market conditions.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      })

      aiSummary = completion.choices[0]?.message?.content || 'Unable to generate insights at the moment.'
    } catch (error) {
      console.error('Error generating AI summary:', error)
      aiSummary = 'Satoshi is meditating on market wisdom... Check back soon!'
    }

    // Create new snapshot
    await prisma.walletSnapshot.create({
      data: {
        userId: user.id,
        balances: tokenDetails,
        totalValue,
      },
    })

    return NextResponse.json({
      totalValue,
      dailyChange,
      tokens: tokenDetails,
      aiSummary,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching portfolio data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    )
  }
}