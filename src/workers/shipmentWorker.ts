import prisma from '@/lib/prisma';
import { DPDAutomation } from '@/services/dpdAutomation';

export const startWorker = () => {
  const automation = new DPDAutomation();
  let isProcessing = false;

  console.log('🚀 数据库轮询 Worker 已启动');

  // 定义轮询函数
  const poll = async () => {
    if (isProcessing) return;
    
    try {
      // 1. 查找第一个状态为 QUEUED 的订单
      const order = await prisma.order.findFirst({
        where: { status: 'QUEUED' },
        include: { dpdAccount: true },
        orderBy: { createdAt: 'asc' }
      });

      if (!order) return;

      isProcessing = true;
      console.log(`📦 正在处理订单: ${order.id}`);

      // 2. 更新状态为 PROCESSING
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PROCESSING' }
      });

      // 3. 执行自动化下单
      const { page } = await automation.login(
        order.dpdAccountId,
        order.dpdAccount.dpdUsername,
        order.dpdAccount.dpdPasswordEnc
      );

      const result = await automation.createShipment(page, order);

      // 4. 更新数据库结果
      if (result.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'SUCCESS',
            trackingNumber: result.trackingNumber,
            errorMessage: null
          }
        });
        
        if (order.batchId) {
          await prisma.batch.update({
            where: { id: order.batchId },
            data: { successCount: { increment: 1 } }
          });
        }
        console.log(`✅ 订单 ${order.id} 处理成功: ${result.trackingNumber}`);
      } else {
        throw new Error(result.error);
      }

    } catch (err: any) {
      console.error(`❌ 处理订单时发生错误:`, err.message);
      // 注意：由于是磁盘轮询，我们就在这里更新失败状态
      // 如果需要重试逻辑，可以增加 retryCount 字段
    } finally {
      isProcessing = false;
    }
  };

  // 每隔 5 秒检查一次数据库
  setInterval(poll, 5000);
};
