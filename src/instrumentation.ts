export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startWorker } = await import('@/workers/shipmentWorker');
    startWorker();
    console.log('Shipment Worker started successfully');
  }
}
