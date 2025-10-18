import { CronJob } from 'cron'
import { monitorWallets } from './monitor'

// Run every 4 hours
const job = new CronJob('0 */4 * * *', async () => {
  console.log('Starting wallet monitoring...')
  try {
    await monitorWallets()
    console.log('Wallet monitoring completed successfully')
  } catch (error) {
    console.error('Error in wallet monitoring job:', error)
  }
})

export function startScheduler() {
  job.start()
  console.log('Scheduler started')
}