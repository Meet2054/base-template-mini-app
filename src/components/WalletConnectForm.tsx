"use client"
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export function WalletConnectForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [wallet, setWallet] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet }),
      })

      if (!response.ok) throw new Error('Registration failed')
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error:', error)
      // Show error message
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 bg-slate-950 p-8 rounded-lg border border-slate-800">
      <div className="space-y-2">
        <Label htmlFor="wallet">Wallet Address</Label>
        <Input
          id="wallet"
          placeholder="0x... or your Solana address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="bg-slate-900"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect Satoshi'}
      </Button>
    </form>
  )
}