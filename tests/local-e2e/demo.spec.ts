import {test, expect} from '@playwright/test';

test('vocabulary navigation, flashcards and saved progress work in a fresh browser', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/auth/login');
  await page.getByLabel('Email', {exact: true}).fill('bob@example.test');
  await page.getByLabel('Mật khẩu', {exact: true}).fill('Test-password-123');
  await page.getByRole('button', {name: 'Đăng nhập', exact: true}).click();
  await expect(page.getByRole('heading', {name: /Xin chào/})).toBeVisible();
  await page.getByRole('navigation').getByRole('link', {name: 'Từ vựng', exact: true}).click();
  await expect(page).toHaveURL(/\/vocabulary$/);
  await expect(page.getByRole('heading', {name: 'Chọn chủ đề', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Bắt đầu học'}).first().click();
  await expect(page).toHaveURL(/\/study\//);
  for (let remaining = 10; remaining > 0; remaining--) {
    await expect(page.getByText(remaining + ' thẻ cần hoàn thành', {exact: true})).toBeVisible();
    await page.getByRole('button', {name: 'Lật thẻ', exact: true}).click();
    await page.getByRole('button', {name: /Đã thuộc/}).click();
    if (remaining === 9) {
      await expect(page.getByText('8 thẻ cần hoàn thành', {exact: true})).toBeVisible();
      await page.reload();
    }
  }
  await expect(page.getByRole('heading', {name: 'Quiz nhanh', exact: true})).toBeVisible();
  await page.getByRole('navigation').getByRole('link', {name: 'Trang chủ', exact: true}).click();
  await expect(page.locator('.stat').filter({hasText: 'Từ vựng đã học'})).toContainText('10');
  await page.getByRole('navigation').getByRole('link', {name: 'Từ vựng', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Chọn chủ đề', exact: true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('one-command local app supports sample login, signup mail and password recovery', async ({page, context}) => {
  await page.goto('/');
  await expect(page.getByLabel('Thông tin bản local')).toContainText('Tiến độ lưu trên máy này');
  await expect(page.locator('.local-account')).toContainText('alice@example.test');
  await expect(page.getByLabel('Email', {exact: true})).toBeEnabled();
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({width, height: 900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({path: 'test-results-local/screenshots/local-login.png', fullPage: true});
  await page.getByLabel('Email', {exact: true}).fill('alice@example.test');
  await page.getByLabel('Mật khẩu', {exact: true}).fill('Test-password-123');
  await page.getByRole('button', {name: 'Đăng nhập', exact: true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.screenshot({path: 'test-results-local/screenshots/local-dashboard.png', fullPage: true});
  await page.getByRole('button', {name: 'Đăng xuất'}).click();
  await page.getByRole('link', {name: 'Đăng ký ngay'}).click();
  const email = 'local-' + Date.now() + '@example.test';
  await page.getByLabel('Họ và tên').fill('Bạn học local');
  await page.getByLabel('Email', {exact: true}).fill(email);
  await page.getByLabel('Mật khẩu', {exact: true}).fill('New-local-123');
  await page.getByLabel('Xác nhận mật khẩu').fill('New-local-123');
  await page.getByRole('button', {name: 'Tạo tài khoản'}).click();
  await expect(page).toHaveURL(/kind=signup/);
  const opened = context.waitForEvent('page');
  await page.getByRole('link', {name: 'Mở hộp thư mô phỏng', exact: true}).click();
  const inbox = await opened;
  await expect(inbox.getByRole('heading', {name: 'Hộp thư mô phỏng'})).toBeVisible();
  await inbox.locator('article').filter({hasText: email}).getByRole('link', {name: 'Mở liên kết'}).click();
  await expect(inbox).toHaveURL(/\/dashboard$/);
  await expect(inbox.getByRole('heading', {name: 'Xin chào, Bạn học local'})).toBeVisible();
  await inbox.getByRole('button', {name: 'Đăng xuất'}).click();
  await inbox.getByRole('link', {name: 'Quên mật khẩu?'}).click();
  await expect(inbox.getByRole('heading', {name: 'Quên mật khẩu', exact: true})).toBeVisible();
  await inbox.getByLabel('Email', {exact: true}).fill(email);
  await inbox.getByRole('button', {name: 'Gửi liên kết'}).click();
  await expect(inbox).toHaveURL(/kind=recovery/);
  const mailOpened = context.waitForEvent('page');
  await inbox.getByRole('link', {name: 'Mở hộp thư mô phỏng', exact: true}).click();
  const recovery = await mailOpened;
  await recovery.locator('article').filter({has: recovery.getByRole('heading', {name: 'Đặt lại mật khẩu', exact: true})}).getByRole('link', {name: 'Mở liên kết'}).click();
  await expect(recovery).toHaveURL(/\/auth\/reset$/);
  await recovery.getByLabel('Mật khẩu', {exact: true}).fill('Changed-local-456');
  await recovery.getByLabel('Xác nhận mật khẩu').fill('Changed-local-456');
  await recovery.getByRole('button', {name: 'Lưu mật khẩu'}).click();
  await expect(recovery).toHaveURL(/\/dashboard$/);
  await recovery.getByRole('button', {name: 'Đăng xuất'}).click();
  await recovery.getByLabel('Email', {exact: true}).fill(email);
  await recovery.getByLabel('Mật khẩu', {exact: true}).fill('Changed-local-456');
  await recovery.getByRole('button', {name: 'Đăng nhập', exact: true}).click();
  await expect(recovery).toHaveURL(/\/dashboard$/);
});
