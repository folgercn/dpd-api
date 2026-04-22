export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.START_SHIPMENT_WORKER !== 'true') {
      console.log('Shipment Worker disabled. Set START_SHIPMENT_WORKER=true to enable it.');
      return;
    }

    const { startWorker } = await import('@/workers/shipmentWorker');
    startWorker();
    console.log('Shipment Worker started successfully');
  }
}
