import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: [
          // Using Vitalik's wallet as a test
          '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          'erc20'
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Alchemy test error:', error);
    return NextResponse.json(
      { error: 'Failed to test Alchemy API', details: error.message },
      { status: 500 }
    );
  }
}