import cron from 'node-cron';
import prisma from './prisma';

// Next.js geliştirme ortamında dosyaları sürekli yeniden derlediği için,
// görevin üst üste 10 kere başlamasını engellemek adına global bir değişken kullanıyoruz.
const globalForCron = global as unknown as { isCronStarted: boolean };

export function startCronJobs() {
  if (globalForCron.isCronStarted) {
    return; // Zaten başladıysa tekrar başlatma
  }

  globalForCron.isCronStarted = true;

  // '* * * * *' ifadesi görevin HER 1 DAKİKADA BİR çalışacağını belirtir.
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      const result = await prisma.reservation.updateMany({
        where: {
          endTime: { lte: now },
          status: 'ACTIVE',
        },
        data: {
          status: 'COMPLETED',
        },
      });

      if (result.count > 0) {
        console.log(`[CRON BAŞARILI] ${result.count} adet süresi dolan rezervasyon otomatik olarak COMPLETED yapıldı.`);
      }
    } catch (error) {
      console.error('[CRON HATASI] Rezervasyon güncellenirken bir sorun oluştu:', error);
    }
  });

  console.log('[CRON] Otomatik sistem başlatıldı. Veritabanı her dakika kontrol edilecek.');
}