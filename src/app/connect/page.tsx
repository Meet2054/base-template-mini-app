import { WalletConnectForm } from '~/components/WalletConnectForm'

export default function ConnectPage() {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Meet Satoshi — Your Crypto Guardian
          </h1>
          <p className="mt-4 text-gray-400">
            Connect your wallet and Telegram to receive AI-powered insights about your portfolio
          </p>
        </div>
        <WalletConnectForm />
      </div>
    </div>
  )
}