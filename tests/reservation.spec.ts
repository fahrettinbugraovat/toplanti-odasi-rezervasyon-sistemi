import { test, expect } from '@playwright/test';

test('E2E: Kapsamlı Sistem Testi (Giriş, Rezervasyon, Düzenleme, Çıkış)', async ({ page }) => {
  // 1. GİRİŞ (LOGIN)
  await page.goto('http://localhost:3000/login');
  await page.locator('input[type="email"]').fill('ovatbugra@gmail.com');
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  await page.waitForURL('http://localhost:3000/');

  // 2. YENİ REZERVASYON OLUŞTURMA
  await page.getByRole('link', { name: 'add Yeni Rezervasyon' }).click();
  await page.waitForTimeout(1500); 
  
  // Sadece AKSARAY geçen ilk odayı seç (Dinamik)
  await page.getByRole('button', { name: /AKSARAY ODASI/i }).first().click();
  await page.getByRole('textbox', { name: 'Örn: Proje İncelemesi' }).fill('aksaray');
  await page.getByRole('button', { name: 'Rezervasyonu Onayla' }).click();
  await page.waitForTimeout(1000); 

  await page.getByText('‹›').click();
  await page.getByRole('button', { name: '›' }).click();
  await page.getByRole('button', { name: 'Bugün' }).click();

  // 3. TOPLANTILARIM VE DÜZENLEME İŞLEMİ
  await page.getByRole('link', { name: 'event_available Toplantılarım' }).click();
  await page.waitForTimeout(1000); 
  
  await page.getByRole('button', { name: 'edit' }).nth(1).click();
  await page.waitForTimeout(500); 
  
  await page.locator('input[type="date"]').fill('2026-09-18');
  // HATA VEREN YER DÜZELTİLDİ: Saat fark etmeksizin "Boş" yazan ilk aralığı seç
  await page.getByRole('button', { name: /Boş/i }).first().click();
  await page.getByRole('button', { name: 'Kaydet' }).first().click(); 
  await page.waitForTimeout(1000); 

  // 4. PANEL ÖZETİ VE HIZLI REZERVASYON
  await page.getByRole('link', { name: 'meeting_room Toplantı Odaları' }).click();
  await page.getByRole('link', { name: 'dashboard Panel Özeti' }).click();
  await page.waitForTimeout(1000); 
  
  // İçinde TRABZON geçen satırı bul ve butonuna tıkla
  await page.getByRole('row', { name: /TRABZON/i }).getByRole('button').first().click();
  await page.waitForTimeout(500);
  
  await page.getByRole('textbox', { name: 'Örn: Hızlı Durum Değ' }).fill('aaaaa');
  await page.getByRole('button', { name: 'Hemen Rezerve Et' }).click();
  await page.waitForTimeout(1000);

  // 5. OLUŞTURULAN REZERVASYONU DÜZENLEME VE KAPATMA
  await page.getByRole('button', { name: 'Düzenle' }).first().click();
  await page.waitForTimeout(500);
  
  await page.locator('input[type="date"]').fill('2026-09-06');
  // İKİNCİ MUHTEMEL HATA YERİ DÜZELTİLDİ: "Boş" yazan ilk aralığı seç
  await page.getByRole('button', { name: /Boş/i }).first().click();
  await page.getByRole('button', { name: 'Kaydet' }).first().click();
  await page.waitForTimeout(1000);
  
  await page.getByRole('button', { name: 'close' }).click();
  await page.waitForTimeout(500);

  // 6. ÇIKIŞ YAPMA
  await page.getByText('FO', { exact: true }).click();
  await page.getByRole('button', { name: 'logout Çıkış Yap' }).click();
  await expect(page).toHaveURL('http://localhost:3000/login');
});